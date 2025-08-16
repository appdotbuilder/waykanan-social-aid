import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { Recipient, CreateRecipientInput, GetRecipientsInput } from '../../../server/src/schema';

interface RecipientManagementProps {
  userId: number;
}

export function RecipientManagement({ userId }: RecipientManagementProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  const [formData, setFormData] = useState<CreateRecipientInput>({
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

  const loadRecipients = useCallback(async () => {
    try {
      const filters: GetRecipientsInput = {};
      if (searchTerm) filters.search = searchTerm;
      if (villageFilter) filters.village = villageFilter;
      if (districtFilter) filters.district = districtFilter;

      const result = await trpc.recipients.getAll.query(filters);
      setRecipients(result);
    } catch (error) {
      console.error('Failed to load recipients:', error);
      setError('Gagal memuat data penerima');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, villageFilter, districtFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRecipients();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [loadRecipients]);

  const resetForm = useCallback(() => {
    setFormData({
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await trpc.recipients.create.mutate({
        ...formData,
        createdBy: userId
      });
      setRecipients(prev => [...prev, result]);
      setIsCreateDialogOpen(false);
      resetForm();
      setSuccess('Data penerima berhasil ditambahkan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to create recipient:', error);
      setError('Gagal menambahkan data penerima. Periksa apakah NIK sudah terdaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getGenderLabel = (gender: string) => {
    return gender === 'laki_laki' ? 'Laki-laki' : 'Perempuan';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Data Penerima Bantuan</h2>
          <p className="text-gray-600 mt-2">Kelola data penerima bantuan sosial</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              Tambah Penerima
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Data Penerima Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi lengkap penerima bantuan
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Informasi Pribadi</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK *</Label>
                    <Input
                      id="nik"
                      value={formData.nik}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, nik: e.target.value }))
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
                      value={formData.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_place">Tempat Lahir *</Label>
                    <Input
                      id="birth_place"
                      value={formData.birth_place}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, birth_place: e.target.value }))
                      }
                      placeholder="Tempat lahir"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Tanggal Lahir *</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, birth_date: new Date(e.target.value) }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: 'laki_laki' | 'perempuan') =>
                        setFormData(prev => ({ ...prev, gender: value }))
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
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, phone: e.target.value || null }))
                      }
                      placeholder="081234567890"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Informasi Alamat</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Lengkap *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Jl. Contoh No. 123, RT/RW 001/002"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="village">Desa/Kelurahan *</Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, village: e.target.value }))
                      }
                      placeholder="Nama desa/kelurahan"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="district">Kecamatan *</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, district: e.target.value }))
                      }
                      placeholder="Nama kecamatan"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regency">Kabupaten</Label>
                    <Input
                      id="regency"
                      value={formData.regency}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, regency: e.target.value }))
                      }
                      placeholder="Kabupaten"
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, province: e.target.value }))
                      }
                      placeholder="Provinsi"
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Kode Pos</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, postal_code: e.target.value || null }))
                      }
                      placeholder="34XXX"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Informasi Tambahan</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marital_status">Status Perkawinan</Label>
                    <Input
                      id="marital_status"
                      value={formData.marital_status || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, marital_status: e.target.value || null }))
                      }
                      placeholder="Belum Kawin/Kawin/Cerai"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Pekerjaan</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, occupation: e.target.value || null }))
                      }
                      placeholder="Pekerjaan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_income">Penghasilan per Bulan</Label>
                    <Input
                      id="monthly_income"
                      type="number"
                      value={formData.monthly_income || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, monthly_income: e.target.value ? parseFloat(e.target.value) : null }))
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
                      value={formData.family_members_count || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, family_members_count: e.target.value ? parseInt(e.target.value) : null }))
                      }
                      placeholder="0"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari (Nama/NIK)</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder="Masukkan nama atau NIK..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="village_filter">Desa/Kelurahan</Label>
              <Input
                id="village_filter"
                value={villageFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVillageFilter(e.target.value)}
                placeholder="Filter berdasarkan desa..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="district_filter">Kecamatan</Label>
              <Input
                id="district_filter"
                value={districtFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistrictFilter(e.target.value)}
                placeholder="Filter berdasarkan kecamatan..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penerima</CardTitle>
          <CardDescription>
            Total {recipients.length} penerima terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">👥</p>
              <p>Belum ada data penerima</p>
              <p className="text-sm">Tambahkan data penerima pertama</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIK</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Desa/Kelurahan</TableHead>
                    <TableHead>Kecamatan</TableHead>
                    <TableHead>Penghasilan</TableHead>
                    <TableHead>Terdaftar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell className="font-mono text-sm">{recipient.nik}</TableCell>
                      <TableCell className="font-medium">{recipient.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getGenderLabel(recipient.gender)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{recipient.address}</TableCell>
                      <TableCell>{recipient.village}</TableCell>
                      <TableCell>{recipient.district}</TableCell>
                      <TableCell>{formatCurrency(recipient.monthly_income)}</TableCell>
                      <TableCell>{recipient.created_at.toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}