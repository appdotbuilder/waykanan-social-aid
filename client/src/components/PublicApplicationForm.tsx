import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { AidProgram, Recipient, CreateRecipientInput, CreateApplicationInput } from '../../../server/src/schema';

interface PublicApplicationFormProps {
  userId: number;
}

export function PublicApplicationForm({ userId }: PublicApplicationFormProps) {
  const [activePrograms, setActivePrograms] = useState<AidProgram[]>([]);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');

  // Forms
  const [step, setStep] = useState(1); // 1: Personal Data, 2: Program Selection
  const [personalForm, setPersonalForm] = useState<CreateRecipientInput>({
    nik: '',
    full_name: '',
    birth_date: new Date(),
    birth_place: '',
    gender: 'laki_laki',
    address: '',
    phone: null,
    village: '',
    district: '',
    regency: 'Way Kanan',
    province: 'Lampung',
    postal_code: null,
    marital_status: null,
    occupation: null,
    monthly_income: null,
    family_members_count: null
  });

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [programsResult] = await Promise.all([
        trpc.aidPrograms.getActive.query()
      ]);
      setActivePrograms(programsResult);

      // Try to load existing recipient data by user ID
      try {
        const recipientResult = await trpc.recipients.getById.query({ id: userId });
        setRecipient(recipientResult);
        // Pre-fill form if recipient exists
        if (recipientResult) {
          setPersonalForm({
            nik: recipientResult.nik,
            full_name: recipientResult.full_name,
            birth_date: recipientResult.birth_date,
            birth_place: recipientResult.birth_place,
            gender: recipientResult.gender,
            address: recipientResult.address,
            phone: recipientResult.phone,
            village: recipientResult.village,
            district: recipientResult.district,
            regency: recipientResult.regency,
            province: recipientResult.province,
            postal_code: recipientResult.postal_code,
            marital_status: recipientResult.marital_status,
            occupation: recipientResult.occupation,
            monthly_income: recipientResult.monthly_income,
            family_members_count: recipientResult.family_members_count
          });
          setStep(2); // Skip to program selection if data exists
        }
      } catch (error) {
        // Recipient not found, that's okay for new users
        console.log('No existing recipient data found');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Gagal memuat data program bantuan');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePersonalFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!recipient) {
        // Create new recipient
        const result = await trpc.recipients.create.mutate({
          ...personalForm,
          createdBy: userId
        });
        setRecipient(result);
      } else {
        // Update existing recipient
        const result = await trpc.recipients.update.mutate({
          id: recipient.id,
          ...personalForm
        });
        setRecipient(result);
      }
      
      setStep(2); // Move to program selection
    } catch (error) {
      console.error('Failed to save personal data:', error);
      setError('Gagal menyimpan data pribadi. Periksa apakah NIK sudah terdaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId || !recipient) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const applicationData: CreateApplicationInput = {
        recipient_id: recipient.id,
        aid_program_id: selectedProgramId,
        notes: null
      };

      const result = await trpc.applications.create.mutate(applicationData);
      setRegistrationNumber(result.registration_number);
      setShowSuccessDialog(true);
      
      // Reset form
      setSelectedProgramId(null);
      setStep(1);
    } catch (error) {
      console.error('Failed to submit application:', error);
      setError('Gagal mengajukan permohonan. Mungkin Anda sudah mengajukan permohonan untuk program ini.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Ajukan Permohonan Bantuan</h2>
        <p className="text-gray-600 mt-2">Isi data pribadi dan pilih program bantuan yang diinginkan</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <span className="font-medium">Data Pribadi</span>
        </div>
        
        <div className={`h-px flex-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <span className="font-medium">Pilih Program</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Personal Data Form */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
            <CardDescription>
              {recipient 
                ? 'Perbarui data pribadi Anda jika diperlukan'
                : 'Masukkan data pribadi Anda untuk mendaftar sebagai penerima bantuan'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePersonalFormSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nik">NIK *</Label>
                  <Input
                    id="nik"
                    value={personalForm.nik}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, nik: e.target.value }))
                    }
                    placeholder="1234567890123456"
                    maxLength={16}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap *</Label>
                  <Input
                    id="full_name"
                    value={personalForm.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder="Nama lengkap sesuai KTP"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_place">Tempat Lahir *</Label>
                  <Input
                    id="birth_place"
                    value={personalForm.birth_place}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, birth_place: e.target.value }))
                    }
                    placeholder="Kota/Kabupaten tempat lahir"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Tanggal Lahir *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={personalForm.birth_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, birth_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Jenis Kelamin *</Label>
                  <Select
                    value={personalForm.gender}
                    onValueChange={(value: 'laki_laki' | 'perempuan') =>
                      setPersonalForm(prev => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laki_laki">Laki-laki</SelectItem>
                      <SelectItem value="perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={personalForm.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, phone: e.target.value || null }))
                    }
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Input
                  id="address"
                  value={personalForm.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPersonalForm(prev => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Jl. Contoh No. 123, RT/RW 001/002"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="village">Desa/Kelurahan *</Label>
                  <Input
                    id="village"
                    value={personalForm.village}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, village: e.target.value }))
                    }
                    placeholder="Nama desa/kelurahan"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="district">Kecamatan *</Label>
                  <Input
                    id="district"
                    value={personalForm.district}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, district: e.target.value }))
                    }
                    placeholder="Nama kecamatan"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_income">Penghasilan per Bulan</Label>
                  <Input
                    id="monthly_income"
                    type="number"
                    value={personalForm.monthly_income || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, monthly_income: e.target.value ? parseFloat(e.target.value) : null }))
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="family_members_count">Jumlah Anggota Keluarga</Label>
                  <Input
                    id="family_members_count"
                    type="number"
                    value={personalForm.family_members_count || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPersonalForm(prev => ({ ...prev, family_members_count: e.target.value ? parseInt(e.target.value) : null }))
                    }
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Lanjut ke Pilihan Program'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Program Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Pilih Program Bantuan</CardTitle>
            <CardDescription>
              Pilih salah satu program bantuan yang tersedia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApplicationSubmit} className="space-y-4">
              <div className="space-y-4">
                {activePrograms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">🎯</p>
                    <p>Tidak ada program bantuan yang aktif saat ini</p>
                    <p className="text-sm">Silakan coba lagi nanti</p>
                  </div>
                ) : (
                  activePrograms.map((program) => (
                    <div
                      key={program.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedProgramId === program.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedProgramId(program.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="program"
                              checked={selectedProgramId === program.id}
                              onChange={() => setSelectedProgramId(program.id)}
                              className="text-blue-600"
                            />
                            <h3 className="font-medium text-lg">{program.name}</h3>
                            <Badge variant="outline">Aktif</Badge>
                          </div>
                          
                          {program.description && (
                            <p className="text-gray-600 text-sm ml-6">
                              {program.description}
                            </p>
                          )}
                          
                          <div className="ml-6 text-sm text-gray-500">
                            {program.start_date && program.end_date && (
                              <p>
                                Periode: {program.start_date.toLocaleDateString('id-ID')} - {program.end_date.toLocaleDateString('id-ID')}
                              </p>
                            )}
                            {program.budget_allocated && (
                              <p>
                                Anggaran: {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0
                                }).format(program.budget_allocated)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Kembali
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedProgramId || activePrograms.length === 0}
                >
                  {isSubmitting ? 'Mengajukan...' : 'Ajukan Permohonan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              🎉 Permohonan Berhasil Diajukan!
            </DialogTitle>
            <DialogDescription className="text-center">
              Permohonan bantuan Anda telah berhasil diajukan
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-900 mb-2">Nomor Registrasi:</p>
              <p className="text-2xl font-bold text-green-700 font-mono">
                {registrationNumber}
              </p>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Simpan nomor registrasi ini untuk melacak status permohonan Anda.</p>
              <p className="mt-2">Tim kami akan meninjau permohonan Anda dan memberikan update secepatnya.</p>
            </div>
            
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="w-full"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}