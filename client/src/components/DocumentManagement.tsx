import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Document, DocumentType, VerifyDocumentInput } from '../../../server/src/schema';

interface DocumentManagementProps {
  userId: number;
}

export function DocumentManagement({ userId }: DocumentManagementProps) {
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verification form
  const [verificationForm, setVerificationForm] = useState({
    is_verified: true,
    notes: ''
  });

  const loadPendingDocuments = useCallback(async () => {
    try {
      const result = await trpc.documents.getPending.query();
      setPendingDocuments(result);
    } catch (error) {
      console.error('Failed to load pending documents:', error);
      setError('Gagal memuat dokumen yang menunggu verifikasi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingDocuments();
  }, [loadPendingDocuments]);

  const handleVerifyDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const verificationData: VerifyDocumentInput = {
        id: selectedDocument.id,
        is_verified: verificationForm.is_verified,
        notes: verificationForm.notes || null
      };

      const result = await trpc.documents.verify.mutate({
        ...verificationData,
        verifiedBy: userId
      });

      setPendingDocuments(prev => prev.filter(doc => doc.id !== result.id));
      
      setIsVerifyDialogOpen(false);
      setSelectedDocument(null);
      setVerificationForm({
        is_verified: true,
        notes: ''
      });
      
      setSuccess(`Dokumen berhasil ${verificationForm.is_verified ? 'diverifikasi' : 'ditolak'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to verify document:', error);
      setError('Gagal memverifikasi dokumen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVerificationDialog = (document: Document) => {
    setSelectedDocument(document);
    setVerificationForm({
      is_verified: true,
      notes: ''
    });
    setIsVerifyDialogOpen(true);
  };

  const getDocumentTypeBadgeVariant = (type: DocumentType) => {
    switch (type) {
      case 'ktp': return 'default';
      case 'kk': return 'secondary';
      case 'surat_keterangan': return 'outline';
      case 'foto': return 'default';
      case 'lainnya': return 'secondary';
      default: return 'outline';
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'ktp': return 'KTP';
      case 'kk': return 'Kartu Keluarga';
      case 'surat_keterangan': return 'Surat Keterangan';
      case 'foto': return 'Foto';
      case 'lainnya': return 'Lainnya';
      default: return type;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Verifikasi Dokumen</h2>
        <p className="text-gray-600 mt-2">Kelola dan verifikasi dokumen penerima bantuan</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Pending Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Menunggu Verifikasi</CardTitle>
          <CardDescription>
            {pendingDocuments.length} dokumen menunggu verifikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">📄</p>
              <p>Tidak ada dokumen yang menunggu verifikasi</p>
              <p className="text-sm">Semua dokumen telah terverifikasi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Dokumen</TableHead>
                    <TableHead>Nama File</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead>Diunggah</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <Badge variant={getDocumentTypeBadgeVariant(document.document_type)}>
                          {getDocumentTypeLabel(document.document_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {document.file_name}
                      </TableCell>
                      <TableCell>
                        {formatFileSize(document.file_size)}
                      </TableCell>
                      <TableCell>
                        {document.uploaded_at.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openVerificationDialog(document)}
                          >
                            Verifikasi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Here you would implement document viewing/download
                              window.alert('Fitur preview dokumen akan diimplementasikan dengan sistem file storage');
                            }}
                          >
                            Lihat
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Verification Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verifikasi Dokumen</DialogTitle>
            <DialogDescription>
              {selectedDocument && (
                <>
                  {getDocumentTypeLabel(selectedDocument.document_type)}: {selectedDocument.file_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleVerifyDocument} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification_status">Status Verifikasi</Label>
              <Select
                value={verificationForm.is_verified.toString()}
                onValueChange={(value) =>
                  setVerificationForm(prev => ({ ...prev, is_verified: value === 'true' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ Diterima/Valid</SelectItem>
                  <SelectItem value="false">❌ Ditolak/Tidak Valid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Verifikasi</Label>
              <Textarea
                id="notes"
                value={verificationForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setVerificationForm(prev => ({ ...prev, notes: e.target.value }))
                }
                placeholder={
                  verificationForm.is_verified 
                    ? "Dokumen valid dan dapat digunakan..."
                    : "Jelaskan alasan penolakan dokumen..."
                }
                rows={3}
              />
            </div>

            {!verificationForm.is_verified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Dokumen yang ditolak akan memerlukan pemeriksaan ulang oleh pemohon.
                  Pastikan alasan penolakan jelas dan dapat dipahami.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVerifyDialogOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                variant={verificationForm.is_verified ? 'default' : 'destructive'}
              >
                {isSubmitting 
                  ? 'Memproses...' 
                  : verificationForm.is_verified ? 'Terima Dokumen' : 'Tolak Dokumen'
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Menunggu Verifikasi</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {pendingDocuments.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Dokumen perlu ditinjau</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total KTP</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {pendingDocuments.filter(doc => doc.document_type === 'ktp').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Dokumen identitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total KK</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {pendingDocuments.filter(doc => doc.document_type === 'kk').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Kartu Keluarga</p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions for Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Panduan Verifikasi Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span>📋</span>
              <div>
                <p className="font-medium">KTP (Kartu Tanda Penduduk):</p>
                <p className="text-gray-600">Pastikan foto jelas, data sesuai dengan formulir, dan masa berlaku masih valid.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <span>👨‍👩‍👧‍👦</span>
              <div>
                <p className="font-medium">Kartu Keluarga:</p>
                <p className="text-gray-600">Periksa kesesuaian data anggota keluarga dan alamat dengan formulir pendaftaran.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <span>📄</span>
              <div>
                <p className="font-medium">Surat Keterangan:</p>
                <p className="text-gray-600">Verifikasi keaslian surat dan kewenangan penerbit surat.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <span>📸</span>
              <div>
                <p className="font-medium">Foto Pendukung:</p>
                <p className="text-gray-600">Pastikan foto sesuai dengan keperluan dan cukup jelas untuk identifikasi.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}