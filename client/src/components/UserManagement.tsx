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
import type { User, UserRole, CreateUserInput } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'masyarakat',
    phone: null
  });

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.users.getAll.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await trpc.auth.register.mutate(newUser);
      setUsers(prev => [...prev, result]);
      setIsCreateDialogOpen(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'masyarakat',
        phone: null
      });
      setSuccess('Pengguna berhasil ditambahkan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Gagal menambahkan pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await trpc.users.deactivate.mutate({ id: userId });
      } else {
        await trpc.users.activate.mutate({ id: userId });
      }
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_active: !isActive }
          : user
      ));
      
      setSuccess(`Pengguna berhasil ${isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      setError('Gagal mengubah status pengguna');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin_dinas': return 'destructive';
      case 'operator_staf': return 'default';
      case 'petugas_lapangan': return 'secondary';
      case 'masyarakat': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin_dinas': return 'Admin Dinas';
      case 'operator_staf': return 'Operator/Staf';
      case 'petugas_lapangan': return 'Petugas Lapangan';
      case 'masyarakat': return 'Masyarakat';
      default: return role;
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
          <h2 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-gray-600 mt-2">Kelola akun pengguna sistem</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi pengguna baru
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUser(prev => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="username"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUser(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewUser(prev => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUser(prev => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Password"
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={newUser.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUser(prev => ({ ...prev, phone: e.target.value || null }))
                    }
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: UserRole) =>
                    setNewUser(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_dinas">Admin Dinas</SelectItem>
                    <SelectItem value="operator_staf">Operator/Staf</SelectItem>
                    <SelectItem value="petugas_lapangan">Petugas Lapangan</SelectItem>
                    <SelectItem value="masyarakat">Masyarakat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
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
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Total {users.length} pengguna terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.created_at.toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={user.is_active ? 'destructive' : 'default'}
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}