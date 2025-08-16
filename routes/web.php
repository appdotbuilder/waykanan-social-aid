<?php

use App\Http\Controllers\AssistanceApplicationController;
use App\Http\Controllers\AssistanceProgramController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/health-check', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
})->name('health-check');

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Assistance Programs
    Route::resource('assistance-programs', AssistanceProgramController::class);
    
    // Assistance Applications
    Route::resource('assistance-applications', AssistanceApplicationController::class);
    
    // Additional application management can be added here
    
    // Field Verification
    Route::get('field-verifications', function () {
        $applications = \App\Models\AssistanceApplication::with(['user', 'assistanceProgram'])
            ->where('field_officer_id', auth()->id())
            ->where('status', 'field_verification')
            ->paginate(10);
        
        return Inertia::render('field-verifications/index', [
            'applications' => $applications
        ]);
    })->name('field-verifications.index');
    
    Route::get('field-verifications/{assistanceApplication}', function ($assistanceApplication) {
        $application = \App\Models\AssistanceApplication::with(['user', 'assistanceProgram', 'reviewer'])
            ->where('field_officer_id', auth()->id())
            ->findOrFail($assistanceApplication);
        
        return Inertia::render('field-verifications/show', [
            'application' => $application
        ]);
    })->name('field-verifications.show');
    
    // My Applications (for public users)
    Route::get('my-applications', function () {
        $applications = auth()->user()->assistanceApplications()
            ->with(['assistanceProgram'])
            ->latest()
            ->paginate(10);
        
        return Inertia::render('my-applications/index', [
            'applications' => $applications
        ]);
    })->name('my-applications.index');
    
    Route::get('my-applications/{assistanceApplication}', function ($assistanceApplication) {
        $application = auth()->user()->assistanceApplications()
            ->with(['assistanceProgram', 'reviewer', 'fieldOfficer', 'distribution'])
            ->findOrFail($assistanceApplication);
        
        return Inertia::render('my-applications/show', [
            'application' => $application
        ]);
    })->name('my-applications.show');
    
    // Complaints System
    Route::resource('complaints', ComplaintController::class);
    
    // Additional complaint management routes can be added here
    
    // My Complaints (for public users)
    Route::get('my-complaints', function () {
        $complaints = auth()->user()->complaints()
            ->latest()
            ->paginate(10);
        
        return Inertia::render('my-complaints/index', [
            'complaints' => $complaints
        ]);
    })->name('my-complaints.index');
    
    Route::get('my-complaints/{complaint}', function ($complaint) {
        $complaint = auth()->user()->complaints()
            ->with(['assignedUser'])
            ->findOrFail($complaint);
        
        return Inertia::render('my-complaints/show', [
            'complaint' => $complaint
        ]);
    })->name('my-complaints.show');
    
    // User Management
    Route::get('users', function () {
        $users = \App\Models\User::latest()->paginate(10);
        return Inertia::render('users/index', [
            'users' => $users
        ]);
    })->name('users.index');
    
    // Reports
    Route::get('reports', function () {
        return Inertia::render('reports/index');
    })->name('reports.index');
    
    Route::get('reports/applications', function () {
        return Inertia::render('reports/applications');
    })->name('reports.applications');
    
    Route::get('reports/distributions', function () {
        return Inertia::render('reports/distributions');
    })->name('reports.distributions');
    
    Route::get('reports/complaints', function () {
        return Inertia::render('reports/complaints');
    })->name('reports.complaints');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';