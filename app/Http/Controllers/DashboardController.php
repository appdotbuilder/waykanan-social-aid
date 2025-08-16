<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AssistanceApplication;
use App\Models\AssistanceProgram;
use App\Models\Complaint;
use App\Models\Distribution;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $stats = $this->getStatsForUser($user);
        $recentActivities = $this->getRecentActivitiesForUser($user);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentActivities' => $recentActivities,
            'user' => array_merge($user->toArray(), [
                'role_display' => $user->getRoleDisplayAttribute()
            ]),
        ]);
    }

    /**
     * Get statistics based on user role.
     */
    protected function getStatsForUser(User $user): array
    {
        if ($user->isAdminDinas() || $user->isOperator()) {
            return [
                'total_applications' => AssistanceApplication::count(),
                'pending_applications' => AssistanceApplication::where('status', 'pending')->count(),
                'approved_applications' => AssistanceApplication::where('status', 'approved')->count(),
                'total_programs' => AssistanceProgram::count(),
                'active_programs' => AssistanceProgram::where('status', 'active')->count(),
                'total_complaints' => Complaint::count(),
                'open_complaints' => Complaint::where('status', 'open')->count(),
                'total_users' => User::where('role', 'masyarakat')->count(),
                'total_distributed' => Distribution::where('is_received', true)->count(),
            ];
        }

        if ($user->isPetugasLapangan()) {
            return [
                'assigned_verifications' => AssistanceApplication::where('field_officer_id', $user->id)
                    ->where('status', 'field_verification')
                    ->count(),
                'completed_verifications' => AssistanceApplication::where('field_officer_id', $user->id)
                    ->whereNotNull('field_verification_at')
                    ->count(),
                'assigned_complaints' => Complaint::where('assigned_to', $user->id)
                    ->whereIn('status', ['open', 'in_progress'])
                    ->count(),
                'resolved_complaints' => Complaint::where('assigned_to', $user->id)
                    ->where('status', 'resolved')
                    ->count(),
            ];
        }

        // Masyarakat stats
        return [
            'my_applications' => $user->assistanceApplications()->count(),
            'approved_applications' => $user->assistanceApplications()->where('status', 'approved')->count(),
            'pending_applications' => $user->assistanceApplications()->where('status', 'pending')->count(),
            'my_complaints' => $user->complaints()->count(),
            'resolved_complaints' => $user->complaints()->where('status', 'resolved')->count(),
            'available_programs' => AssistanceProgram::where('status', 'active')
                ->where('registration_start', '<=', now())
                ->where('registration_end', '>=', now())
                ->count(),
        ];
    }

    /**
     * Get recent activities based on user role.
     */
    protected function getRecentActivitiesForUser(User $user): array
    {
        $activities = [];

        if ($user->isAdminDinas() || $user->isOperator()) {
            /** @var \Illuminate\Database\Eloquent\Collection<int, AssistanceApplication> $applications */
            $applications = AssistanceApplication::with(['user', 'assistanceProgram'])
                ->latest()
                ->limit(5)
                ->get();
            
            foreach ($applications as $app) {
                /** @var AssistanceApplication $app */
                $activities[] = [
                    'type' => 'application',
                    'title' => 'Permohonan Bantuan Baru',
                    'description' => $app->user->name . ' mengajukan ' . $app->assistanceProgram->name,
                    'status' => $app->getStatusDisplayAttribute(),
                    'date' => $app->created_at->diffForHumans(),
                    'url' => route('assistance-applications.show', $app),
                ];
            }

            /** @var \Illuminate\Database\Eloquent\Collection<int, Complaint> $complaints */
            $complaints = Complaint::with('user')
                ->latest()
                ->limit(3)
                ->get();
            
            foreach ($complaints as $complaint) {
                /** @var Complaint $complaint */
                $activities[] = [
                    'type' => 'complaint',
                    'title' => 'Pengaduan Baru',
                    'description' => $complaint->subject,
                    'status' => $complaint->getStatusDisplayAttribute(),
                    'date' => $complaint->created_at->diffForHumans(),
                    'url' => route('complaints.show', $complaint),
                ];
            }

            return array_slice($activities, 0, 8);
        }

        if ($user->isPetugasLapangan()) {
            /** @var \Illuminate\Database\Eloquent\Collection<int, AssistanceApplication> $verifications */
            $verifications = AssistanceApplication::with(['user', 'assistanceProgram'])
                ->where('field_officer_id', $user->id)
                ->where('status', 'field_verification')
                ->latest()
                ->limit(5)
                ->get();

            foreach ($verifications as $app) {
                /** @var AssistanceApplication $app */
                $activities[] = [
                    'type' => 'verification',
                    'title' => 'Verifikasi Lapangan',
                    'description' => 'Verifikasi untuk ' . $app->user->name,
                    'status' => $app->getStatusDisplayAttribute(),
                    'date' => $app->created_at->diffForHumans(),
                    'url' => route('field-verifications.show', $app),
                ];
            }

            /** @var \Illuminate\Database\Eloquent\Collection<int, Complaint> $assignedComplaints */
            $assignedComplaints = Complaint::with('user')
                ->where('assigned_to', $user->id)
                ->whereIn('status', ['open', 'in_progress'])
                ->latest()
                ->limit(3)
                ->get();

            foreach ($assignedComplaints as $complaint) {
                /** @var Complaint $complaint */
                $activities[] = [
                    'type' => 'complaint',
                    'title' => 'Pengaduan Ditugaskan',
                    'description' => $complaint->subject,
                    'status' => $complaint->getStatusDisplayAttribute(),
                    'date' => $complaint->created_at->diffForHumans(),
                    'url' => route('complaints.show', $complaint),
                ];
            }

            return array_slice($activities, 0, 8);
        }

        // Masyarakat activities
        /** @var \Illuminate\Database\Eloquent\Collection<int, AssistanceApplication> $myApplications */
        $myApplications = $user->assistanceApplications()
            ->with('assistanceProgram')
            ->latest()
            ->limit(5)
            ->get();

        foreach ($myApplications as $app) {
            /** @var AssistanceApplication $app */
            $activities[] = [
                'type' => 'application',
                'title' => 'Permohonan Bantuan',
                'description' => $app->assistanceProgram->name,
                'status' => $app->getStatusDisplayAttribute(),
                'date' => $app->created_at->diffForHumans(),
                'url' => route('my-applications.show', $app),
            ];
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Complaint> $myComplaints */
        $myComplaints = $user->complaints()
            ->latest()
            ->limit(3)
            ->get();

        foreach ($myComplaints as $complaint) {
            /** @var Complaint $complaint */
            $activities[] = [
                'type' => 'complaint',
                'title' => 'Pengaduan',
                'description' => $complaint->subject,
                'status' => $complaint->getStatusDisplayAttribute(),
                'date' => $complaint->created_at->diffForHumans(),
                'url' => route('my-complaints.show', $complaint),
            ];
        }

        return array_slice($activities, 0, 8);
    }
}