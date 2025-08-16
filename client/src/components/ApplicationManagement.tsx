import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { Application, UserRole, GetApplicationsInput, UpdateApplicationStatusInput, ApplicationStatus } from '../../../server/src/schema';

interface ApplicationManagementProps {
  userRole: UserRole;
  userId: number;
}

export function ApplicationManagement({ userRole, userId }: ApplicationManagementProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  // Status update form
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'diterima' as ApplicationStatus,
    notes: '',
    rejection_reason: ''
  });

  const loadApplications = useCallback(async () => {
    try {
      const filters: GetApplicationsInput = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const result = await trpc.applications.getAll.query(filters);
      setApplications(result);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setError('Gagal memuat data permohonan');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updateData: UpdateApplicationStatusInput = {
        id: selectedApplication.id,
        status: statusUpdateForm.status,
        notes: statusUpdateForm.notes || null,
        rejection_reason: statusUpdateForm.status === 'ditolak' 
          ? statusUpdateForm.rejection_reason || null 
          : null
      };

      const result = await trpc.applications.updateStatus.mutate({
        ...updateData,
        updatedBy: userId
      });

      setApplications(prev => prev.map(app => 
        app.id === result.id ? result : app
      ));

      setIsStatusDialogOpen(false);
      setSelectedApplication(null);
      setStatusUpdateForm({
        status: 'diterima',
        notes: '',
        rejection_reason: ''
      });
      
      setSuccess('Status permohonan berhasil diperbarui');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to update application status:', error);
      setError('Gagal memperbarui status permohonan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStatusDialog = (application: Application) => {
    setSelectedApplication(application);
    setStatusUpdateForm({
      status: application.status,
      notes: application.notes || '',
      rejection_reason: application.rejection_reason || ''
    });
    setIsStatusDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: ApplicationStatus) => {
    switch (status) {
      case 'diterima': return 'default';
      case 'diproses': return 'secondary';
      case 'disetujui': return 'default';
      case 'ditolak': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case 'diterima': return 'Diterima';
      case 'diproses': return 'Diproses';
      case 'disetujui': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  const canUpdateStatus = (userRole: UserRole) => {
    return userRole === 'admin_dinas' || userRole === 'operator_staf';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Manajemen Permohonan</h2>
          <p className="text-gray-600 mt-2">Kelola permohonan bantuan sosial</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Permohonan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter">Status:</Label>
              <Select
                value={statusFilter}
                onValueChange={(value: ApplicationStatus | 'all') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="diterima">Diterima</SelectItem>
                  <SelectItem value="diproses">Diproses</SelectItem>
                  <SelectItem value="disetujui">Disetujui</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Permohonan</CardTitle>
          <CardDescription>
            Total {applications.length} permohonan
            {statusFilter !== 'all' && ` dengan status ${getStatusLabel(statusFilter)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">📄</p>
              <p>Tidak ada permohonan yang ditemukan</p>
              <p className="text-sm">
                {statusFilter === 'all' 
                  ? 'Belum ada permohonan yang masuk'
                  : `Tidak ada permohonan dengan status ${getStatusLabel(statusFilter)}`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Registrasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Pengajuan</TableHead>
                    <TableHead>Diproses Pada</TableHead>
                    <TableHead>Catatan</TableHead>
                    {canUpdateStatus(userRole) && <TableHead>Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {application.registration_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {application.submission_date.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        {application.processed_at 
                          ? application.processed_at.toLocaleDateString('id-ID')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {application.notes || '-'}
                      </TableCell>
                      {canUpdateStatus(userRole) && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStatusDialog(application)}
                          >
                            Update Status
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status Permohonan</DialogTitle>
            <DialogDescription>
              {selectedApplication && (
                <>Permohonan: {selectedApplication.registration_number}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status Baru</Label>
              <Select
                value={statusUpdateForm.status}
                onValueChange={(value: ApplicationStatus) =>
                  setStatusUpdateForm(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diterima">Diterima</SelectItem>
                  <SelectItem value="diproses">Diproses</SelectItem>
                  <SelectItem value="disetujui">Disetujui</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={statusUpdateForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setStatusUpdateForm(prev => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Tambahkan catatan untuk permohonan ini..."
                rows={3}
              />
            </div>

            {statusUpdateForm.status === 'ditolak' && (
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Alasan Penolakan *</Label>
                <Textarea
                  id="rejection_reason"
                  value={statusUpdateForm.rejection_reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setStatusUpdateForm(prev => ({ ...prev, rejection_reason: e.target.value }))
                  }
                  placeholder="Jelaskan alasan penolakan..."
                  rows={3}
                  required={statusUpdateForm.status === 'ditolak'}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}