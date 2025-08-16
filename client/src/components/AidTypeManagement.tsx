import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { AidType, CreateAidTypeInput, UpdateAidTypeInput } from '../../../server/src/schema';

export function AidTypeManagement() {
  const [aidTypes, setAidTypes] = useState<AidType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAidType, setEditingAidType] = useState<AidType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAidTypeInput>({
    name: '',
    description: null,
    requirements: null
  });

  const loadAidTypes = useCallback(async () => {
    try {
      const result = await trpc.aidTypes.getAll.query();
      setAidTypes(result);
    } catch (error) {
      console.error('Failed to load aid types:', error);
      setError('Gagal memuat data jenis bantuan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAidTypes();
  }, [loadAidTypes]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: null,
      requirements: null
    });
    setEditingAidType(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingAidType) {
        // Update existing aid type
        const updateData: UpdateAidTypeInput = {
          id: editingAidType.id,
          name: formData.name,
          description: formData.description,
          requirements: formData.requirements
        };
        
        const result = await trpc.aidTypes.update.mutate(updateData);
        setAidTypes(prev => prev.map(item => 
          item.id === result.id ? result : item
        ));
        setSuccess('Jenis bantuan berhasil diperbarui');
      } else {
        // Create new aid type
        const result = await trpc.aidTypes.create.mutate(formData);
        setAidTypes(prev => [...prev, result]);
        setSuccess('Jenis bantuan berhasil ditambahkan');
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save aid type:', error);
      setError('Gagal menyimpan jenis bantuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (aidType: AidType) => {
    setEditingAidType(aidType);
    setFormData({
      name: aidType.name,
      description: aidType.description,
      requirements: aidType.requirements
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.aidTypes.delete.mutate({ id });
      setAidTypes(prev => prev.filter(item => item.id !== id));
      setSuccess('Jenis bantuan berhasil dihapus');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to delete aid type:', error);
      setError('Gagal menghapus jenis bantuan');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Jenis Bantuan</h2>
          <p className="text-gray-600 mt-2">Kelola master data jenis bantuan sosial</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              Tambah Jenis Bantuan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAidType ? 'Edit Jenis Bantuan' : 'Tambah Jenis Bantuan Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingAidType 
                  ? 'Perbarui informasi jenis bantuan'
                  : 'Masukkan informasi jenis bantuan baru'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Jenis Bantuan *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Contoh: Bantuan Sembako, PKH, dll"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData(prev => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Deskripsi jenis bantuan..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Persyaratan</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData(prev => ({ ...prev, requirements: e.target.value || null }))
                  }
                  placeholder="Persyaratan untuk mendapatkan bantuan..."
                  rows={3}
                />
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
                    : editingAidType ? 'Perbarui' : 'Simpan'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
        {aidTypes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">📋</p>
                <p>Belum ada jenis bantuan terdaftar</p>
                <p className="text-sm">Tambahkan jenis bantuan pertama Anda</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          aidTypes.map((aidType) => (
            <Card key={aidType.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{aidType.name}</span>
                      <Badge variant={aidType.is_active ? 'default' : 'secondary'}>
                        {aidType.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </CardTitle>
                    {aidType.description && (
                      <CardDescription>{aidType.description}</CardDescription>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(aidType)}
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
                          <AlertDialogTitle>Hapus Jenis Bantuan</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jenis bantuan "{aidType.name}"? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(aidType.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              {aidType.requirements && (
                <CardContent>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Persyaratan:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {aidType.requirements}
                    </p>
                  </div>
                </CardContent>
              )}
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Dibuat: {aidType.created_at.toLocaleDateString('id-ID')}</span>
                  <span>Diperbarui: {aidType.updated_at.toLocaleDateString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}