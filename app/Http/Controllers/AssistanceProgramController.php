<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssistanceProgramRequest;
use App\Http\Requests\UpdateAssistanceProgramRequest;
use App\Models\AssistanceProgram;
use Inertia\Inertia;

class AssistanceProgramController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $programs = AssistanceProgram::withCount('applications')
            ->latest()
            ->paginate(10);

        return Inertia::render('assistance-programs/index', [
            'programs' => $programs
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('assistance-programs/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssistanceProgramRequest $request)
    {
        $program = AssistanceProgram::create($request->validated());

        return redirect()->route('assistance-programs.show', $program)
            ->with('success', 'Program bantuan berhasil dibuat.');
    }

    /**
     * Display the specified resource.
     */
    public function show(AssistanceProgram $assistanceProgram)
    {
        $assistanceProgram->load(['applications.user']);
        
        return Inertia::render('assistance-programs/show', [
            'program' => $assistanceProgram,
            'applications' => $assistanceProgram->applications()->with('user')->paginate(10)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AssistanceProgram $assistanceProgram)
    {
        return Inertia::render('assistance-programs/edit', [
            'program' => $assistanceProgram
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAssistanceProgramRequest $request, AssistanceProgram $assistanceProgram)
    {
        $assistanceProgram->update($request->validated());

        return redirect()->route('assistance-programs.show', $assistanceProgram)
            ->with('success', 'Program bantuan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AssistanceProgram $assistanceProgram)
    {
        $assistanceProgram->delete();

        return redirect()->route('assistance-programs.index')
            ->with('success', 'Program bantuan berhasil dihapus.');
    }
}