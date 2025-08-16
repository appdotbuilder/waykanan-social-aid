<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssistanceApplicationRequest extends FormRequest
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
            'assistance_program_id' => 'required|exists:assistance_programs,id',
            'personal_data' => 'required|array',
            'personal_data.full_name' => 'required|string|max:255',
            'personal_data.nik' => 'required|string|size:16',
            'personal_data.birth_place' => 'required|string|max:255',
            'personal_data.birth_date' => 'required|date',
            'personal_data.gender' => 'required|in:L,P',
            'personal_data.religion' => 'required|string|max:255',
            'personal_data.education' => 'required|string|max:255',
            'personal_data.occupation' => 'required|string|max:255',
            'personal_data.phone' => 'required|string|max:20',
            'personal_data.address' => 'required|string',
            'family_data' => 'required|array',
            'family_data.family_size' => 'required|integer|min:1',
            'family_data.dependents' => 'required|integer|min:0',
            'family_data.family_members' => 'nullable|array',
            'economic_data' => 'required|array',
            'economic_data.monthly_income' => 'required|numeric|min:0',
            'economic_data.income_source' => 'required|string|max:255',
            'economic_data.house_ownership' => 'required|in:milik_sendiri,sewa,kontrak,menumpang',
            'economic_data.asset_ownership' => 'nullable|array',
            'documents' => 'required|array',
            'documents.ktp' => 'required|string',
            'documents.kk' => 'required|string',
            'documents.sktm' => 'nullable|string',
            'documents.additional' => 'nullable|array',
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
            'assistance_program_id.required' => 'Program bantuan harus dipilih.',
            'assistance_program_id.exists' => 'Program bantuan tidak valid.',
            'personal_data.required' => 'Data pribadi harus diisi.',
            'personal_data.full_name.required' => 'Nama lengkap harus diisi.',
            'personal_data.nik.required' => 'NIK harus diisi.',
            'personal_data.nik.size' => 'NIK harus 16 digit.',
            'personal_data.birth_place.required' => 'Tempat lahir harus diisi.',
            'personal_data.birth_date.required' => 'Tanggal lahir harus diisi.',
            'personal_data.gender.required' => 'Jenis kelamin harus dipilih.',
            'personal_data.religion.required' => 'Agama harus diisi.',
            'personal_data.education.required' => 'Pendidikan harus diisi.',
            'personal_data.occupation.required' => 'Pekerjaan harus diisi.',
            'personal_data.phone.required' => 'Nomor telepon harus diisi.',
            'personal_data.address.required' => 'Alamat harus diisi.',
            'family_data.required' => 'Data keluarga harus diisi.',
            'family_data.family_size.required' => 'Jumlah anggota keluarga harus diisi.',
            'family_data.dependents.required' => 'Jumlah tanggungan harus diisi.',
            'economic_data.required' => 'Data ekonomi harus diisi.',
            'economic_data.monthly_income.required' => 'Pendapatan bulanan harus diisi.',
            'economic_data.income_source.required' => 'Sumber pendapatan harus diisi.',
            'economic_data.house_ownership.required' => 'Status kepemilikan rumah harus dipilih.',
            'documents.required' => 'Dokumen pendukung harus diupload.',
            'documents.ktp.required' => 'KTP harus diupload.',
            'documents.kk.required' => 'Kartu Keluarga harus diupload.',
        ];
    }
}