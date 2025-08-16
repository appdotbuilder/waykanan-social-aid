<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComplaintRequest;
use App\Http\Requests\UpdateComplaintRequest;
use App\Models\Complaint;
use App\Models\User;
use Inertia\Inertia;

class ComplaintController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $complaints = Complaint::with(['user', 'assignedUser'])
            ->latest()
            ->paginate(10);

        return Inertia::render('complaints/index', [
            'complaints' => $complaints
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('complaints/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreComplaintRequest $request)
    {
        $data = $request->validated();
        $data['ticket_number'] = Complaint::generateTicketNumber();
        $data['user_id'] = auth()->id();

        $complaint = Complaint::create($data);

        return redirect()->route('complaints.show', $complaint)
            ->with('success', 'Pengaduan berhasil diajukan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Complaint $complaint)
    {
        $complaint->load(['user', 'assignedUser']);

        return Inertia::render('complaints/show', [
            'complaint' => $complaint
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Complaint $complaint)
    {
        // Only allow editing if complaint is still open and user is the owner
        if ($complaint->status !== 'open' || $complaint->user_id !== auth()->id()) {
            return redirect()->route('complaints.show', $complaint)
                ->with('error', 'Pengaduan tidak dapat diubah.');
        }

        return Inertia::render('complaints/edit', [
            'complaint' => $complaint
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateComplaintRequest $request, Complaint $complaint)
    {
        // Only allow updating if complaint is still open and user is the owner
        if ($complaint->status !== 'open' || $complaint->user_id !== auth()->id()) {
            return redirect()->route('complaints.show', $complaint)
                ->with('error', 'Pengaduan tidak dapat diubah.');
        }

        $complaint->update($request->validated());

        return redirect()->route('complaints.show', $complaint)
            ->with('success', 'Pengaduan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Complaint $complaint)
    {
        // Only allow deletion if complaint is still open and user is the owner or admin
        $user = auth()->user();
        if ($complaint->status !== 'open' || 
            ($complaint->user_id !== $user->id && !$user->isAdminDinas() && !$user->isOperator())) {
            return redirect()->route('complaints.index')
                ->with('error', 'Pengaduan tidak dapat dihapus.');
        }

        $complaint->delete();

        return redirect()->route('complaints.index')
            ->with('success', 'Pengaduan berhasil dihapus.');
    }


}