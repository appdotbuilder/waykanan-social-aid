<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssistanceApplicationRequest;
use App\Http\Requests\UpdateAssistanceApplicationRequest;
use App\Models\AssistanceApplication;
use App\Models\AssistanceProgram;
use App\Models\User;
use Inertia\Inertia;

class AssistanceApplicationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $applications = AssistanceApplication::with(['user', 'assistanceProgram', 'reviewer', 'fieldOfficer'])
            ->latest()
            ->paginate(10);

        return Inertia::render('assistance-applications/index', [
            'applications' => $applications
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $programs = AssistanceProgram::where('status', 'active')
            ->where('registration_start', '<=', now())
            ->where('registration_end', '>=', now())
            ->get();

        return Inertia::render('assistance-applications/create', [
            'programs' => $programs
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssistanceApplicationRequest $request)
    {
        $data = $request->validated();
        $data['application_number'] = AssistanceApplication::generateApplicationNumber();
        $data['user_id'] = auth()->id();

        $application = AssistanceApplication::create($data);

        return redirect()->route('assistance-applications.show', $application)
            ->with('success', 'Permohonan bantuan berhasil diajukan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(AssistanceApplication $assistanceApplication)
    {
        $assistanceApplication->load(['user', 'assistanceProgram', 'reviewer', 'fieldOfficer', 'distribution']);

        return Inertia::render('assistance-applications/show', [
            'application' => $assistanceApplication
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AssistanceApplication $assistanceApplication)
    {
        // Only allow editing if application is still pending
        if ($assistanceApplication->status !== 'pending') {
            return redirect()->route('assistance-applications.show', $assistanceApplication)
                ->with('error', 'Permohonan tidak dapat diubah karena sudah diproses.');
        }

        $programs = AssistanceProgram::where('status', 'active')
            ->where('registration_start', '<=', now())
            ->where('registration_end', '>=', now())
            ->get();

        return Inertia::render('assistance-applications/edit', [
            'application' => $assistanceApplication,
            'programs' => $programs
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAssistanceApplicationRequest $request, AssistanceApplication $assistanceApplication)
    {
        // Only allow updating if application is still pending
        if ($assistanceApplication->status !== 'pending') {
            return redirect()->route('assistance-applications.show', $assistanceApplication)
                ->with('error', 'Permohonan tidak dapat diubah karena sudah diproses.');
        }

        $assistanceApplication->update($request->validated());

        return redirect()->route('assistance-applications.show', $assistanceApplication)
            ->with('success', 'Permohonan bantuan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AssistanceApplication $assistanceApplication)
    {
        // Only allow deletion if application is still pending
        if ($assistanceApplication->status !== 'pending') {
            return redirect()->route('assistance-applications.index')
                ->with('error', 'Permohonan tidak dapat dihapus karena sudah diproses.');
        }

        $assistanceApplication->delete();

        return redirect()->route('assistance-applications.index')
            ->with('success', 'Permohonan bantuan berhasil dihapus.');
    }


}