import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Sistem Bantuan Sosial Kabupaten Way Kanan">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-6 text-gray-800 lg:p-8 dark:from-gray-900 dark:to-gray-800 dark:text-gray-200">
                {/* Header */}
                <header className="mb-8 w-full max-w-6xl mx-auto">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">🏛️</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Dinas Sosial</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Kabupaten Way Kanan</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center px-6 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Daftar
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                                🤝 Sistem Bantuan Sosial
                            </h2>
                            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
                                Dinas Sosial Kabupaten Way Kanan
                            </p>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-12">
                                Platform digital untuk mempercepat layanan bantuan sosial, 
                                mempermudah pengumpulan data, dan meningkatkan transparansi 
                                serta akuntabilitas dalam distribusi bantuan.
                            </p>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                            {/* Online Application */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                                    <span className="text-2xl">📝</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Pendaftaran Online
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Ajukan permohonan bantuan sosial secara online dengan mudah dan cepat
                                </p>
                            </div>

                            {/* Verification Process */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Verifikasi Digital
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Proses verifikasi dan validasi data yang efisien termasuk survei lapangan
                                </p>
                            </div>

                            {/* Real-time Tracking */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Pelacakan Real-time
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Pantau status permohonan dan distribusi bantuan secara real-time
                                </p>
                            </div>

                            {/* Public Complaints */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                                    <span className="text-2xl">💬</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Sistem Pengaduan
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Sampaikan keluhan dan saran melalui sistem ticketing yang terintegrasi
                                </p>
                            </div>
                        </div>

                        {/* User Roles */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                                👥 Akses Multi-Role
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">👨‍💼</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Admin Dinas</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Kelola program bantuan dan supervisi sistem
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">👩‍💻</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Operator/Staf</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Proses permohonan dan kelola data penerima
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">🏃‍♂️</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Petugas Lapangan</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Verifikasi lapangan dan distribusi bantuan
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">👨‍👩‍👧‍👦</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Masyarakat</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Ajukan permohonan bantuan dan lacak status
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="text-center mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                ✨ Manfaat Sistem
                            </h3>
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800 rounded-xl p-6">
                                    <span className="text-3xl mb-4 block">⚡</span>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Proses Lebih Cepat
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        Otomasi proses mengurangi waktu tunggu dan meningkatkan efisiensi layanan
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900 dark:to-cyan-800 rounded-xl p-6">
                                    <span className="text-3xl mb-4 block">📋</span>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Data Terintegrasi
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        Pengumpulan data yang terpusat dan terstandarisasi untuk pengambilan keputusan
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900 dark:to-violet-800 rounded-xl p-6">
                                    <span className="text-3xl mb-4 block">🔍</span>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Transparansi Tinggi
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        Akuntabilitas dan transparansi dalam setiap tahap distribusi bantuan
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Call to Action */}
                        {!auth.user && (
                            <div className="text-center">
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                                    <h3 className="text-2xl font-bold mb-4">
                                        Siap Menggunakan Sistem?
                                    </h3>
                                    <p className="text-xl mb-6 opacity-90">
                                        Bergabunglah dengan sistem bantuan sosial digital Way Kanan
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link
                                            href={route('register')}
                                            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition duration-200"
                                        >
                                            📝 Daftar Sekarang
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="inline-flex items-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition duration-200"
                                        >
                                            🔑 Masuk ke Sistem
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="max-w-6xl mx-auto py-8 border-t border-gray-200 dark:border-gray-700">
                        <p>
                            © 2024 Dinas Sosial Kabupaten Way Kanan. Sistem Bantuan Sosial Digital.
                        </p>
                        <p className="mt-2">
                            Dikembangkan untuk meningkatkan pelayanan publik dan kesejahteraan masyarakat.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}