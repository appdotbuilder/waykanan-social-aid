import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { Heading } from '@/components/heading';

interface AssistanceProgram {
    id: number;
    name: string;
    description: string;
    type: string;
    type_display: string;
    amount: number | null;
    quota: number;
    remaining_quota: number;
    status: string;
    registration_start: string;
    registration_end: string;
    applications_count: number;
    [key: string]: unknown;
}

interface Props {
    programs: {
        data: AssistanceProgram[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export default function AssistanceProgramsIndex({ programs }: Props) {
    return (
        <AppShell>
            <Head title="Program Bantuan" />
            
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Heading level={1}>🎯 Program Bantuan</Heading>
                    <Link
                        href="/assistance-programs/create"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        ➕ Buat Program Baru
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                    <div className="p-6">
                        {programs.data && programs.data.length > 0 ? (
                            <div className="space-y-4">
                                {programs.data.map((program) => (
                                    <div key={program.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    {program.name}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                                    {program.description}
                                                </p>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center">
                                                        📋 {program.type_display}
                                                    </span>
                                                    {program.amount && (
                                                        <span className="flex items-center">
                                                            💰 Rp {program.amount.toLocaleString('id-ID')}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center">
                                                        👥 {program.applications_count} / {program.quota} pendaftar
                                                    </span>
                                                    <span className="flex items-center">
                                                        📅 {program.registration_start} - {program.registration_end}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex flex-col space-y-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    program.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    program.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {program.status === 'active' ? '✅ Aktif' :
                                                     program.status === 'draft' ? '📝 Draft' :
                                                     program.status === 'closed' ? '🔒 Ditutup' :
                                                     '✅ Selesai'}
                                                </span>
                                                <Link
                                                    href={`/assistance-programs/${program.id}`}
                                                    className="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Lihat Detail →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <span className="text-4xl mb-4 block">📭</span>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Belum ada program bantuan
                                </p>
                                <Link
                                    href="/assistance-programs/create"
                                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Buat Program Pertama
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}