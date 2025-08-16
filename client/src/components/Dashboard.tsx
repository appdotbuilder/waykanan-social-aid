import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { UserRole, DashboardStats } from '../../../server/src/schema';

interface DashboardProps {
  userRole: UserRole;
  userId: number;
}

export function Dashboard({ userRole, userId }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardStats = useCallback(async () => {
    try {
      const result = await trpc.dashboard.getStats.query();
      setStats(result);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Tidak dapat memuat statistik dashboard</p>
        </CardContent>
      </Card>
    );
  }

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
      case 'diproses': return 'Diproses';
      case 'disetujui': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Selamat datang! Berikut ringkasan sistem bantuan sosial.
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Permohonan</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-600">
              {stats.total_applications.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>📝</span>
              <span>Semua status</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Penerima</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">
              {stats.total_recipients.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>👥</span>
              <span>Data terdaftar</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Program Aktif</CardDescription>
            <CardTitle className="text-3xl font-bold text-purple-600">
              {stats.active_programs.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>🎯</span>
              <span>Sedang berjalan</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Survey Pending</CardDescription>
            <CardTitle className="text-3xl font-bold text-orange-600">
              {stats.pending_surveys.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>🔍</span>
              <span>Menunggu survey</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Permohonan</CardTitle>
          <CardDescription>
            Distribusi permohonan berdasarkan status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.applications_by_status).map(([status, count]) => {
              const percentage = stats.total_applications > 0 
                ? (count / stats.total_applications) * 100 
                : 0;
              
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(status)}>
                        {getStatusLabel(status)}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {count.toLocaleString()} permohonan
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Quick Actions */}
      {userRole !== 'masyarakat' && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Tugas yang perlu perhatian segera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRole === 'operator_staf' && (
                <>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>📄</span>
                      <h3 className="font-medium">Dokumen Belum Diverifikasi</h3>
                    </div>
                    <p className="text-sm text-gray-600">Periksa dokumen yang menunggu verifikasi</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>📝</span>
                      <h3 className="font-medium">Permohonan Baru</h3>
                    </div>
                    <p className="text-sm text-gray-600">Tinjau permohonan yang baru masuk</p>
                  </div>
                </>
              )}
              
              {userRole === 'petugas_lapangan' && (
                <>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>🔍</span>
                      <h3 className="font-medium">Survey Pending</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats.pending_surveys} survey menunggu dilakukan
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>📋</span>
                      <h3 className="font-medium">Survey Hari Ini</h3>
                    </div>
                    <p className="text-sm text-gray-600">Jadwal survey untuk hari ini</p>
                  </div>
                </>
              )}
              
              {userRole === 'admin_dinas' && (
                <>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>👥</span>
                      <h3 className="font-medium">Kelola Pengguna</h3>
                    </div>
                    <p className="text-sm text-gray-600">Tambah atau edit akun pengguna</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>📊</span>
                      <h3 className="font-medium">Laporan Bulanan</h3>
                    </div>
                    <p className="text-sm text-gray-600">Lihat laporan progress bulanan</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>🎯</span>
                      <h3 className="font-medium">Program Bantuan</h3>
                    </div>
                    <p className="text-sm text-gray-600">Kelola program bantuan sosial</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}