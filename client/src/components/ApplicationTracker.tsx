import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { Application } from '../../../server/src/schema';

interface ApplicationTrackerProps {
  userId?: number; // Optional - if provided, show user's applications
}

export function ApplicationTracker({ userId }: ApplicationTrackerProps) {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [application, setApplication] = useState<Application | null>(null);
  const [userApplications, setUserApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user applications if userId is provided
  const loadUserApplications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.applications.getByRecipient.query({ recipientId: userId });
      setUserApplications(result);
    } catch (error) {
      console.error('Failed to load user applications:', error);
      setError('Gagal memuat data permohonan Anda');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserApplications();
    }
  }, [loadUserApplications, userId]);

  const handleTrackApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim()) return;

    setIsLoading(true);
    setError(null);
    setApplication(null);

    try {
      const result = await trpc.applications.getByRegistrationNumber.query({
        registrationNumber: registrationNumber.trim()
      });
      setApplication(result);
    } catch (error) {
      console.error('Failed to track application:', error);
      setError('Permohonan dengan nomor registrasi tersebut tidak ditemukan');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'diterima': return 'default';
      case 'diproses': return 'secondary';
      case 'disetujui': return 'default';
      case 'ditolak': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'diterima': return 'Diterima';
      case 'diproses': return 'Sedang Diproses';
      case 'disetujui': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'diterima': return 25;
      case 'diproses': return 50;
      case 'disetujui': return 100;
      case 'ditolak': return 100;
      default: return 0;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'diterima': 
        return 'Permohonan Anda telah diterima dan sedang dalam tahap verifikasi awal.';
      case 'diproses': 
        return 'Permohonan sedang diproses oleh petugas. Mohon menunggu untuk tahap selanjutnya.';
      case 'disetujui': 
        return 'Selamat! Permohonan Anda telah disetujui. Silakan menunggu informasi selanjutnya.';
      case 'ditolak': 
        return 'Mohon maaf, permohonan Anda ditolak. Silakan lihat alasan penolakan di bawah.';
      default: 
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          {userId ? 'Status Permohonan Anda' : 'Lacak Status Permohonan'}
        </h2>
        <p className="text-gray-600 mt-2">
          {userId 
            ? 'Lihat status semua permohonan bantuan Anda'
            : 'Masukkan nomor registrasi untuk melacak status permohonan'
          }
        </p>
      </div>

      {!userId && (
        <Card>
          <CardHeader>
            <CardTitle>Lacak Permohonan</CardTitle>
            <CardDescription>
              Masukkan nomor registrasi yang Anda terima saat mengajukan permohonan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackApplication} className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="registration_number" className="sr-only">
                    Nomor Registrasi
                  </Label>
                  <Input
                    id="registration_number"
                    value={registrationNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegistrationNumber(e.target.value)
                    }
                    placeholder="Contoh: REG-2024-001234"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Mencari...' : 'Lacak'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Display tracked application */}
      {application && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Status Permohonan</span>
              <Badge variant={getStatusBadgeVariant(application.status)}>
                {getStatusLabel(application.status)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Nomor Registrasi: {application.registration_number}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-500">
                  {getStatusProgress(application.status)}%
                </span>
              </div>
              <Progress 
                value={getStatusProgress(application.status)} 
                className="h-3"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Deskripsi Status</h4>
                <p className="text-sm text-gray-600">
                  {getStatusDescription(application.status)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Tanggal Pengajuan</h4>
                  <p className="text-sm text-gray-600">
                    {application.submission_date.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {application.processed_at && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Tanggal Diproses</h4>
                    <p className="text-sm text-gray-600">
                      {application.processed_at.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {application.approved_at && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Tanggal Disetujui</h4>
                    <p className="text-sm text-gray-600">
                      {application.approved_at.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {application.notes && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Catatan</h4>
                  <p className="text-sm text-gray-600">{application.notes}</p>
                </div>
              )}

              {application.rejection_reason && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Alasan Penolakan</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{application.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>

            {application.status === 'ditolak' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-sm text-blue-900 mb-2">
                  💡 Saran untuk Permohonan Selanjutnya
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Pastikan semua dokumen lengkap dan sesuai persyaratan</li>
                  <li>• Periksa kembali data yang dimasukkan</li>
                  <li>• Konsultasikan dengan petugas dinas jika diperlukan</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Display user applications if userId provided */}
      {userId && userApplications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Riwayat Permohonan</h3>
          {userApplications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {app.registration_number}
                    </CardTitle>
                    <CardDescription>
                      Diajukan pada {app.submission_date.toLocaleDateString('id-ID')}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-500">
                      {getStatusProgress(app.status)}%
                    </span>
                  </div>
                  <Progress 
                    value={getStatusProgress(app.status)} 
                    className="h-2"
                  />
                </div>
                
                {app.notes && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-1">Catatan</h4>
                    <p className="text-sm text-gray-600">{app.notes}</p>
                  </div>
                )}

                {app.rejection_reason && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm mb-1">Alasan Penolakan</h4>
                    <p className="text-sm text-red-600">{app.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {userId && userApplications.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">📄</p>
              <p>Anda belum memiliki permohonan bantuan</p>
              <p className="text-sm">Ajukan permohonan bantuan pertama Anda</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}