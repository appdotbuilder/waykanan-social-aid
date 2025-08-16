import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, UserRole } from '../../server/src/schema';

// Import components
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/components/Dashboard';
import { UserManagement } from '@/components/UserManagement';
import { AidTypeManagement } from '@/components/AidTypeManagement';
import { AidProgramManagement } from '@/components/AidProgramManagement';
import { RecipientManagement } from '@/components/RecipientManagement';
import { ApplicationManagement } from '@/components/ApplicationManagement';
import { DocumentManagement } from '@/components/DocumentManagement';
import { SurveyManagement } from '@/components/SurveyManagement';
import { PublicApplicationForm } from '@/components/PublicApplicationForm';
import { ApplicationTracker } from '@/components/ApplicationTracker';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = useCallback(async (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setActiveTab('login');
  }, []);

  // Get available tabs based on user role
  const getAvailableTabs = useCallback((role: UserRole) => {
    const baseTabs = [
      { id: 'dashboard', label: '📊 Dashboard', roles: ['admin_dinas', 'operator_staf', 'petugas_lapangan'] },
    ];

    const adminTabs = [
      { id: 'users', label: '👥 Manajemen Pengguna', roles: ['admin_dinas'] },
      { id: 'aid-types', label: '📋 Jenis Bantuan', roles: ['admin_dinas'] },
      { id: 'aid-programs', label: '🎯 Program Bantuan', roles: ['admin_dinas', 'operator_staf'] },
    ];

    const operatorTabs = [
      { id: 'recipients', label: '👨‍👩‍👧‍👦 Data Penerima', roles: ['admin_dinas', 'operator_staf'] },
      { id: 'applications', label: '📝 Permohonan', roles: ['admin_dinas', 'operator_staf', 'petugas_lapangan'] },
      { id: 'documents', label: '📄 Dokumen', roles: ['admin_dinas', 'operator_staf'] },
    ];

    const fieldTabs = [
      { id: 'surveys', label: '🔍 Survey Lapangan', roles: ['admin_dinas', 'petugas_lapangan'] },
    ];

    const publicTabs = [
      { id: 'apply', label: '📋 Ajukan Permohonan', roles: ['masyarakat'] },
      { id: 'track', label: '🔍 Lacak Status', roles: ['masyarakat'] },
    ];

    const allTabs = [...baseTabs, ...adminTabs, ...operatorTabs, ...fieldTabs, ...publicTabs];
    return allTabs.filter(tab => tab.roles.includes(role));
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">🏛️</span>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-900">
              Dinas Sosial Kabupaten Way Kanan
            </CardTitle>
            <CardDescription className="text-sm">
              Sistem Manajemen Bantuan Sosial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="track">Lacak Status</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onLogin={handleLogin} />
              </TabsContent>
              
              <TabsContent value="track">
                <ApplicationTracker />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableTabs = getAvailableTabs(currentUser.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl text-white">🏛️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Dinas Sosial Way Kanan
                </h1>
                <p className="text-sm text-gray-500">Sistem Bantuan Sosial</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 w-full mb-6">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-6">
            <Dashboard userRole={currentUser.role} userId={currentUser.id} />
          </TabsContent>

          {/* User Management (Admin only) */}
          {currentUser.role === 'admin_dinas' && (
            <TabsContent value="users" className="mt-6">
              <UserManagement />
            </TabsContent>
          )}

          {/* Aid Types Management (Admin only) */}
          {currentUser.role === 'admin_dinas' && (
            <TabsContent value="aid-types" className="mt-6">
              <AidTypeManagement />
            </TabsContent>
          )}

          {/* Aid Programs Management */}
          {(currentUser.role === 'admin_dinas' || currentUser.role === 'operator_staf') && (
            <TabsContent value="aid-programs" className="mt-6">
              <AidProgramManagement userRole={currentUser.role} />
            </TabsContent>
          )}

          {/* Recipients Management */}
          {(currentUser.role === 'admin_dinas' || currentUser.role === 'operator_staf') && (
            <TabsContent value="recipients" className="mt-6">
              <RecipientManagement userId={currentUser.id} />
            </TabsContent>
          )}

          {/* Applications Management */}
          {(currentUser.role === 'admin_dinas' || currentUser.role === 'operator_staf' || currentUser.role === 'petugas_lapangan') && (
            <TabsContent value="applications" className="mt-6">
              <ApplicationManagement userRole={currentUser.role} userId={currentUser.id} />
            </TabsContent>
          )}

          {/* Documents Management */}
          {(currentUser.role === 'admin_dinas' || currentUser.role === 'operator_staf') && (
            <TabsContent value="documents" className="mt-6">
              <DocumentManagement userId={currentUser.id} />
            </TabsContent>
          )}

          {/* Surveys Management */}
          {(currentUser.role === 'admin_dinas' || currentUser.role === 'petugas_lapangan') && (
            <TabsContent value="surveys" className="mt-6">
              <SurveyManagement userRole={currentUser.role} userId={currentUser.id} />
            </TabsContent>
          )}

          {/* Public Application Form */}
          {currentUser.role === 'masyarakat' && (
            <TabsContent value="apply" className="mt-6">
              <PublicApplicationForm userId={currentUser.id} />
            </TabsContent>
          )}

          {/* Application Tracker for Public */}
          {currentUser.role === 'masyarakat' && (
            <TabsContent value="track" className="mt-6">
              <ApplicationTracker userId={currentUser.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

export default App;