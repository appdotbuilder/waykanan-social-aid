<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssistanceProgramRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->isAdminDinas() || $this->user()->isOperator();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:bantuan_tunai,bantuan_barang,bantuan_jasa',
            'amount' => 'nullable|numeric|min:0',
            'requirements' => 'required|string',
            'registration_start' => 'required|date',
            'registration_end' => 'required|date|after:registration_start',
            'quota' => 'required|integer|min:1',
            'status' => 'required|in:draft,active,closed,completed',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama program bantuan harus diisi.',
            'description.required' => 'Deskripsi program bantuan harus diisi.',
            'type.required' => 'Jenis bantuan harus dipilih.',
            'type.in' => 'Jenis bantuan tidak valid.',
            'amount.numeric' => 'Jumlah bantuan harus berupa angka.',
            'requirements.required' => 'Persyaratan bantuan harus diisi.',
            'registration_start.required' => 'Tanggal mulai pendaftaran harus diisi.',
            'registration_end.required' => 'Tanggal berakhir pendaftaran harus diisi.',
            'registration_end.after' => 'Tanggal berakhir pendaftaran harus setelah tanggal mulai.',
            'quota.required' => 'Kuota penerima bantuan harus diisi.',
            'quota.min' => 'Kuota penerima bantuan minimal 1.',
            'status.required' => 'Status program harus dipilih.',
            'status.in' => 'Status program tidak valid.',
        ];
    }
}