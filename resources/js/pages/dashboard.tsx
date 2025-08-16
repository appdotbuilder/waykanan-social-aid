import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { Heading } from '@/components/heading';

interface DashboardProps extends Record<string, unknown> {
    stats: Record<string, number>;
    recentActivities: Array<{
        type: string;
        title: string;
        description: string;
        status: string;
        date: string;
        url: string;
    }>;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        role_display: string;
        [key: string]: unknown;
    };
}

export default function Dashboard() {
    const { stats, recentActivities, user } = usePage<DashboardProps>().props;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '🌅 Selamat Pagi';
        if (hour < 17) return '☀️ Selamat Siang';
        if (hour < 21) return '🌆 Selamat Sore';
        return '🌙 Selamat Malam';
    };

    const getStatsCards = () => {
        if (user.role === 'admin_dinas' || user.role === 'operator') {
            return [
                { title: 'Total Permohonan', value: stats.total_applications || 0, icon: '📋', color: 'bg-blue-500' },
                { title: 'Menunggu Review', value: stats.pending_applications || 0, icon: '⏳', color: 'bg-yellow-500' },
                { title: 'Program Aktif', value: stats.active_programs || 0, icon: '🎯', color: 'bg-green-500' },
                { title: 'Pengaduan Terbuka', value: stats.open_complaints || 0, icon: '💬', color: 'bg-red-500' },
            ];
        }

        if (user.role === 'petugas_lapangan') {
            return [
                { title: 'Verifikasi Ditugaskan', value: stats.assigned_verifications || 0, icon: '🔍', color: 'bg-purple-500' },
                { title: 'Verifikasi Selesai', value: stats.completed_verifications || 0, icon: '✅', color: 'bg-green-500' },
                { title: 'Pengaduan Ditugaskan', value: stats.assigned_complaints || 0, icon: '📞', color: 'bg-orange-500' },
                { title: 'Pengaduan Selesai', value: stats.resolved_complaints || 0, icon: '🎉', color: 'bg-blue-500' },
            ];
        }

        // Masyarakat stats
        return [
            { title: 'Permohonan Saya', value: stats.my_applications || 0, icon: '📝', color: 'bg-blue-500' },
            { title: 'Disetujui', value: stats.approved_applications || 0, icon: '✅', color: 'bg-green-500' },
            { title: 'Program Tersedia', value: stats.available_programs || 0, icon: '🎯', color: 'bg-purple-500' },
            { title: 'Pengaduan Saya', value: stats.my_complaints || 0, icon: '💬', color: 'bg-orange-500' },
        ];
    };

    const statsCards = getStatsCards();

    return (
        <AppShell>
            <Head title="Dashboard" />
            
            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">
                                {getGreeting()}, {user.name}!
                            </h1>
                            <p className="text-blue-100">
                                Selamat datang di Dashboard {user.role_display || 'Sistem Bantuan Sosial'}
                            </p>
                        </div>
                        <div className="text-4xl">
                            {user.role === 'admin_dinas' ? '👨‍💼' : 
                             user.role === 'operator' ? '👩‍💻' :
                             user.role === 'petugas_lapangan' ? '🏃‍♂️' : '👨‍👩‍👧‍👦'}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white mr-4`}>
                                    <span className="text-xl">{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {stat.title}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activities */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <Heading level={2}>📊 Aktivitas Terkini</Heading>
                    </div>
                    <div className="p-6">
                        {recentActivities && recentActivities.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                            <span className="text-sm">
                                                {activity.type === 'application' ? '📝' :
                                                 activity.type === 'complaint' ? '💬' :
                                                 activity.type === 'verification' ? '🔍' : '📋'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {activity.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {activity.date}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {activity.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <span className="text-4xl mb-4 block">📭</span>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Belum ada aktivitas terkini
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <Heading level={2}>⚡ Aksi Cepat</Heading>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {user.role === 'masyarakat' && (
                                <>
                                    <a
                                        href="/assistance-applications/create"
                                        className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <span className="text-2xl mr-3">📝</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                Ajukan Bantuan
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Buat permohonan baru
                                            </p>
                                        </div>
                                    </a>
                                    <a
                                        href="/complaints/create"
                                        className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <span className="text-2xl mr-3">💬</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                Buat Pengaduan
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Sampaikan keluhan
                                            </p>
                                        </div>
                                    </a>
                                </>
                            )}
                            
                            {(user.role === 'admin_dinas' || user.role === 'operator') && (
                                <>
                                    <a
                                        href="/assistance-programs/create"
                                        className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <span className="text-2xl mr-3">🎯</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                Program Baru
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Buat program bantuan
                                            </p>
                                        </div>
                                    </a>
                                    <a
                                        href="/assistance-applications"
                                        className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <span className="text-2xl mr-3">📋</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                Review Permohonan
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Kelola aplikasi masuk
                                            </p>
                                        </div>
                                    </a>
                                </>
                            )}

                            <a
                                href="/reports"
                                className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                <span className="text-2xl mr-3">📊</span>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        Laporan
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Lihat statistik
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}