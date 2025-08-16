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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { Survey, UserRole, CreateSurveyInput, UpdateSurveyInput, SurveyStatus } from '../../../server/src/schema';

interface SurveyManagementProps {
  userRole: UserRole;
  userId: number;
}

export function SurveyManagement({ userRole, userId }: SurveyManagementProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Survey form data
  const [surveyForm, setSurveyForm] = useState<UpdateSurveyInput>({
    id: 0,
    status: 'belum_survey',
    survey_date: null,
    house_condition: null,
    income_verification: null,
    family_condition: null,
    recommendations: null,
    photo_urls: null,
    survey_notes: null
  });

  const loadSurveys = useCallback(async () => {
    try {
      let result;
      if (userRole === 'petugas_lapangan') {
        // Load surveys assigned to this field officer
        result = await trpc.surveys.getBySurveyor.query({ surveyorId: userId });
      } else {
        // Admin can see all surveys
        result = await trpc.surveys.getPending.query();
      }
      setSurveys(result);
    } catch (error) {
      console.error('Failed to load surveys:', error);
      setError('Gagal memuat data survey');
    } finally {
      setIsLoading(false);
    }
  }, [userRole, userId]);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const handleUpdateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurvey) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await trpc.surveys.update.mutate(surveyForm);
      
      setSurveys(prev => prev.map(survey => 
        survey.id === result.id ? result : survey
      ));

      setIsEditDialogOpen(false);
      setSelectedSurvey(null);
      
      setSuccess('Data survey berhasil diperbarui');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to update survey:', error);
      setError('Gagal memperbarui data survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (survey: Survey) => {
    setSelectedSurvey(survey);
    setSurveyForm({
      id: survey.id,
      status: survey.status,
      survey_date: survey.survey_date,
      house_condition: survey.house_condition,
      income_verification: survey.income_verification,
      family_condition: survey.family_condition,
      recommendations: survey.recommendations,
      photo_urls: survey.photo_urls,
      survey_notes: survey.survey_notes
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: SurveyStatus) => {
    switch (status) {
      case 'belum_survey': return 'secondary';
      case 'sedang_survey': return 'default';
      case 'selesai_survey': return 'default';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: SurveyStatus) => {
    switch (status) {
      case 'belum_survey': return 'Belum Survey';
      case 'sedang_survey': return 'Sedang Survey';
      case 'selesai_survey': return 'Selesai Survey';
      default: return status;
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
        <h2 className="text-3xl font-bold text-gray-900">Survey Lapangan</h2>
        <p className="text-gray-600 mt-2">
          {userRole === 'petugas_lapangan' 
            ? 'Kelola survey lapangan yang ditugaskan kepada Anda'
            : 'Monitor progress survey lapangan'
          }
        </p>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Belum Survey</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {surveys.filter(s => s.status === 'belum_survey').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Menunggu dikerjakan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sedang Survey</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {surveys.filter(s => s.status === 'sedang_survey').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Dalam proses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selesai</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {surveys.filter(s => s.status === 'selesai_survey').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Telah selesai</p>
          </CardContent>
        </Card>
      </div>

      {/* Surveys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Survey</CardTitle>
          <CardDescription>
            Total {surveys.length} survey
            {userRole === 'petugas_lapangan' && ' yang ditugaskan'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">🔍</p>
              <p>
                {userRole === 'petugas_lapangan' 
                  ? 'Tidak ada survey yang ditugaskan kepada Anda'
                  : 'Tidak ada survey yang tersedia'
                }
              </p>
              <p className="text-sm">Survey akan muncul setelah permohonan disetujui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Survey</TableHead>
                    <TableHead>Kondisi Rumah</TableHead>
                    <TableHead>Verifikasi Penghasilan</TableHead>
                    <TableHead>Rekomendasi</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(survey.status)}>
                          {getStatusLabel(survey.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {survey.survey_date 
                          ? survey.survey_date.toLocaleDateString('id-ID')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {survey.house_condition || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {survey.income_verification || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {survey.recommendations || '-'}
                      </TableCell>
                      <TableCell>
                        {survey.created_at.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(survey)}
                        >
                          {survey.status === 'belum_survey' ? 'Mulai Survey' : 'Edit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Survey Form Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSurvey?.status === 'belum_survey' 
                ? 'Mulai Survey Lapangan' 
                : 'Update Survey Lapangan'
              }
            </DialogTitle>
            <DialogDescription>
              Isi hasil survey lapangan untuk permohonan ini
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateSurvey} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status Survey</Label>
                <Select
                  value={surveyForm.status}
                  onValueChange={(value: SurveyStatus) =>
                    setSurveyForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum_survey">Belum Survey</SelectItem>
                    <SelectItem value="sedang_survey">Sedang Survey</SelectItem>
                    <SelectItem value="selesai_survey">Selesai Survey</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="survey_date">Tanggal Survey</Label>
                <Input
                  id="survey_date"
                  type="date"
                  value={surveyForm.survey_date 
                    ? surveyForm.survey_date.toISOString().split('T')[0] 
                    : ''
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSurveyForm(prev => ({ 
                      ...prev, 
                      survey_date: e.target.value ? new Date(e.target.value) : null 
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="house_condition">Kondisi Rumah</Label>
              <Textarea
                id="house_condition"
                value={surveyForm.house_condition || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSurveyForm(prev => ({ ...prev, house_condition: e.target.value || null }))
                }
                placeholder="Deskripsikan kondisi fisik rumah, atap, dinding, lantai, dll..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income_verification">Verifikasi Penghasilan</Label>
              <Textarea
                id="income_verification"
                value={surveyForm.income_verification || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSurveyForm(prev => ({ ...prev, income_verification: e.target.value || null }))
                }
                placeholder="Hasil verifikasi sumber dan besaran penghasilan keluarga..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="family_condition">Kondisi Keluarga</Label>
              <Textarea
                id="family_condition"
                value={surveyForm.family_condition || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSurveyForm(prev => ({ ...prev, family_condition: e.target.value || null }))
                }
                placeholder="Kondisi anggota keluarga, kesehatan, pendidikan, dll..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Rekomendasi</Label>
              <Textarea
                id="recommendations"
                value={surveyForm.recommendations || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSurveyForm(prev => ({ ...prev, recommendations: e.target.value || null }))
                }
                placeholder="Rekomendasi apakah layak menerima bantuan dan saran lainnya..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="survey_notes">Catatan Survey</Label>
              <Textarea
                id="survey_notes"
                value={surveyForm.survey_notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSurveyForm(prev => ({ ...prev, survey_notes: e.target.value || null }))
                }
                placeholder="Catatan tambahan dari hasil survey..."
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">📝 Panduan Survey</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Pastikan alamat sesuai dengan data permohonan</li>
                <li>• Dokumentasikan kondisi rumah dengan foto</li>
                <li>• Verifikasi penghasilan dengan bukti atau wawancara tetangga</li>
                <li>• Periksa kondisi keluarga dan kebutuhan bantuan</li>
                <li>• Berikan rekomendasi yang objektif dan sesuai kebijakan</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Survey'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Instructions for Field Officers */}
      {userRole === 'petugas_lapangan' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Panduan Petugas Lapangan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <span>🏠</span>
                <div>
                  <p className="font-medium">Survey Kondisi Rumah:</p>
                  <p className="text-gray-600">Periksa struktur bangunan, material dinding, atap, lantai, dan fasilitas dasar seperti listrik, air.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <span>💰</span>
                <div>
                  <p className="font-medium">Verifikasi Penghasilan:</p>
                  <p className="text-gray-600">Konfirmasi sumber penghasilan, besaran pendapatan, dan kesesuaian dengan data yang disampaikan.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <span>👨‍👩‍👧‍👦</span>
                <div>
                  <p className="font-medium">Kondisi Keluarga:</p>
                  <p className="text-gray-600">Evaluasi jumlah anggota keluarga, kondisi kesehatan, pendidikan anak, dan kebutuhan khusus.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <span>📋</span>
                <div>
                  <p className="font-medium">Rekomendasi:</p>
                  <p className="text-gray-600">Berikan penilaian objektif apakah pemohon layak menerima bantuan berdasarkan kriteria yang ada.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}