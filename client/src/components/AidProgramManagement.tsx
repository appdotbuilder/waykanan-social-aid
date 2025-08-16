import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { AidProgram, AidType, UserRole, CreateAidProgramInput, UpdateAidProgramInput } from '../../../server/src/schema';

interface AidProgramManagementProps {
  userRole: UserRole;
}

export function AidProgramManagement({ userRole }: AidProgramManagementProps) {
  const [aidPrograms, setAidPrograms] = useState<AidProgram[]>([]);
  const [aidTypes, setAidTypes] = useState<AidType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AidProgram | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAidProgramInput>({
    name: '',
    description: null,
    aid_type_id: 0,
    budget_allocated: null,
    start_date: null,
    end_date: null
  });

  const loadData = useCallback(async () => {
    try {
      const [programsResult, typesResult] = await Promise.all([
        trpc.aidPrograms.getAll.query(),
        trpc.aidTypes.getAll.query()
      ]);
      setAidPrograms(programsResult);
      setAidTypes(typesResult);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Gagal memuat data program bantuan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: null,
      aid_type_id: 0,
      budget_allocated: null,
      start_date: null,
      end_date: null
    });
    setEditingProgram(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingProgram) {
        // Update existing program
        const updateData: UpdateAidProgramInput = {
          id: editingProgram.id,
          name: formData.name,
          description: formData.description,
          aid_type_id: formData.aid_type_id,
          budget_allocated: formData.budget_allocated,
          start_date: formData.start_date,
          end_date: formData.end_date
        };
        
        const result = await trpc.aidPrograms.update.mutate(updateData);
        setAidPrograms(prev => prev.map(item => 
          item.id === result.id ? result : item
        ));
        setSuccess('Program bantuan berhasil diperbarui');
      } else {
        // Create new program
        const result = await trpc.aidPrograms.create.mutate(formData);
        setAidPrograms(prev => [...prev, result]);
        setSuccess('Program bantuan berhasil ditambahkan');
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save program:', error);
      setError('Gagal menyimpan program bantuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (program: AidProgram) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description,
      aid_type_id: program.aid_type_id,
      budget_allocated: program.budget_allocated,
      start_date: program.start_date,
      end_date: program.end_date
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.aidPrograms.delete.mutate({ id });
      setAidPrograms(prev => prev.filter(item => item.id !== id));
      setSuccess('Program bantuan berhasil dihapus');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to delete program:', error);
      setError('Gagal menghapus program bantuan');
    }
  };

  const getAidTypeName = (aidTypeId: number) => {
    const aidType = aidTypes.find(type => type.id === aidTypeId);
    return aidType ? aidType.name : 'Unknown';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Program Bantuan</h2>
          <p className="text-gray-600 mt-2">Kelola program bantuan sosial</p>
        </div>

        {userRole === 'admin_dinas' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <span className="mr-2">➕</span>
                Tambah Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProgram ? 'Edit Program Bantuan' : 'Tambah Program Bantuan Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingProgram 
                    ? 'Perbarui informasi program bantuan'
                    : 'Masukkan informasi program bantuan baru'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Program *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nama program bantuan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aid_type_id">Jenis Bantuan *</Label>
                  <Select
                    value={formData.aid_type_id.toString()}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, aid_type_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis bantuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {aidTypes.filter(type => type.is_active).map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData(prev => ({ ...prev, description: e.target.value || null }))
                    }
                    placeholder="Deskripsi program..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_allocated">Anggaran yang Dialokasikan</Label>
                  <Input
                    id="budget_allocated"
                    type="number"
                    value={formData.budget_allocated || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, budget_allocated: e.target.value ? parseFloat(e.target.value) : null }))
                    }
                    placeholder="0"
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date ? formData.start_date.toISOString().split('T')[0] : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, start_date: e.target.value ? new Date(e.target.value) : null }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Tanggal Berakhir</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date ? formData.end_date.toISOString().split('T')[0] : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, end_date: e.target.value ? new Date(e.target.value) : null }))
                      }
                    />
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
                    {isSubmitting 
                      ? 'Menyimpan...' 
                      : editingProgram ? 'Perbarui' : 'Simpan'
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
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

      <div className="grid gap-6">
        {aidPrograms.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">🎯</p>
                <p>Belum ada program bantuan terdaftar</p>
                <p className="text-sm">Tambahkan program bantuan pertama Anda</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          aidPrograms.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{program.name}</span>
                      <Badge variant={program.is_active ? 'default' : 'secondary'}>
                        {program.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mb-1">
                        {getAidTypeName(program.aid_type_id)}
                      </Badge>
                      {program.description && (
                        <p className="mt-1">{program.description}</p>
                      )}
                    </CardDescription>
                  </div>
                  
                  {userRole === 'admin_dinas' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(program)}
                      >
                        ✏️ Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            🗑️ Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Program Bantuan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus program "{program.name}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(program.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Ya, Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Anggaran</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(program.budget_allocated)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Tanggal Mulai</h4>
                    <p className="text-sm text-gray-600">
                      {program.start_date 
                        ? program.start_date.toLocaleDateString('id-ID')
                        : '-'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Tanggal Berakhir</h4>
                    <p className="text-sm text-gray-600">
                      {program.end_date 
                        ? program.end_date.toLocaleDateString('id-ID')
                        : '-'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t">
                  <span>Dibuat: {program.created_at.toLocaleDateString('id-ID')}</span>
                  <span>Diperbarui: {program.updated_at.toLocaleDateString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}