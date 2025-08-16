import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await trpc.auth.login.mutate(formData);
      
      if (result.user) {
        onLogin(result.user);
      } else {
        setError('Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan saat login. Periksa username dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Masukkan username"
          value={formData.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, username: e.target.value }))
          }
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Masukkan password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, password: e.target.value }))
          }
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Masuk...' : 'Masuk'}
      </Button>
      
      <div className="text-center text-sm text-gray-600 mt-4">
        <p>Akun Demo:</p>
        <p><strong>Admin:</strong> admin / password123</p>
        <p><strong>Operator:</strong> operator / password123</p>
        <p><strong>Petugas:</strong> petugas / password123</p>
        <p><strong>Masyarakat:</strong> user / password123</p>
      </div>
    </form>
  );
}