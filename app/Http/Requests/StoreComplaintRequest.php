<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreComplaintRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:layanan,distribusi,verifikasi,sistem,lainnya',
            'priority' => 'required|in:low,medium,high,urgent',
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
            'subject.required' => 'Subjek pengaduan harus diisi.',
            'subject.max' => 'Subjek pengaduan maksimal 255 karakter.',
            'description.required' => 'Deskripsi pengaduan harus diisi.',
            'category.required' => 'Kategori pengaduan harus dipilih.',
            'category.in' => 'Kategori pengaduan tidak valid.',
            'priority.required' => 'Prioritas pengaduan harus dipilih.',
            'priority.in' => 'Prioritas pengaduan tidak valid.',
        ];
    }
}