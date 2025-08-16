import { z } from 'zod';

// Enums for various status and role types
export const userRoleSchema = z.enum(['admin_dinas', 'operator_staf', 'petugas_lapangan', 'masyarakat']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const applicationStatusSchema = z.enum(['diterima', 'diproses', 'disetujui', 'ditolak']);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const documentTypeSchema = z.enum(['ktp', 'kk', 'surat_keterangan', 'foto', 'lainnya']);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const surveyStatusSchema = z.enum(['belum_survey', 'sedang_survey', 'selesai_survey']);
export type SurveyStatus = z.infer<typeof surveyStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  phone: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Aid type schema
export const aidTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  requirements: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AidType = z.infer<typeof aidTypeSchema>;

// Aid program schema
export const aidProgramSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  aid_type_id: z.number(),
  budget_allocated: z.number().nullable(),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AidProgram = z.infer<typeof aidProgramSchema>;

// Recipient schema
export const recipientSchema = z.object({
  id: z.number(),
  nik: z.string(),
  full_name: z.string(),
  birth_date: z.coerce.date(),
  birth_place: z.string(),
  gender: z.enum(['laki_laki', 'perempuan']),
  address: z.string(),
  phone: z.string().nullable(),
  village: z.string(),
  district: z.string(),
  regency: z.string(),
  province: z.string(),
  postal_code: z.string().nullable(),
  marital_status: z.string().nullable(),
  occupation: z.string().nullable(),
  monthly_income: z.number().nullable(),
  family_members_count: z.number().int().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Recipient = z.infer<typeof recipientSchema>;

// Application schema
export const applicationSchema = z.object({
  id: z.number(),
  registration_number: z.string(),
  recipient_id: z.number(),
  aid_program_id: z.number(),
  status: applicationStatusSchema,
  submission_date: z.coerce.date(),
  notes: z.string().nullable(),
  processed_by: z.number().nullable(),
  processed_at: z.coerce.date().nullable(),
  approved_by: z.number().nullable(),
  approved_at: z.coerce.date().nullable(),
  rejection_reason: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Application = z.infer<typeof applicationSchema>;

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  recipient_id: z.number(),
  document_type: documentTypeSchema,
  file_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  is_verified: z.boolean(),
  verified_by: z.number().nullable(),
  verified_at: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  uploaded_at: z.coerce.date()
});

export type Document = z.infer<typeof documentSchema>;

// Survey schema
export const surveySchema = z.object({
  id: z.number(),
  application_id: z.number(),
  surveyor_id: z.number(),
  status: surveyStatusSchema,
  survey_date: z.coerce.date().nullable(),
  house_condition: z.string().nullable(),
  income_verification: z.string().nullable(),
  family_condition: z.string().nullable(),
  recommendations: z.string().nullable(),
  photo_urls: z.array(z.string()).nullable(),
  survey_notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Survey = z.infer<typeof surveySchema>;

// Input schemas for creating entities

// User input schemas
export const createUserInputSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: userRoleSchema,
  phone: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Aid type input schemas
export const createAidTypeInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  requirements: z.string().nullable().optional()
});

export type CreateAidTypeInput = z.infer<typeof createAidTypeInputSchema>;

export const updateAidTypeInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateAidTypeInput = z.infer<typeof updateAidTypeInputSchema>;

// Aid program input schemas
export const createAidProgramInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  aid_type_id: z.number(),
  budget_allocated: z.number().positive().nullable().optional(),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional()
});

export type CreateAidProgramInput = z.infer<typeof createAidProgramInputSchema>;

export const updateAidProgramInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  aid_type_id: z.number().optional(),
  budget_allocated: z.number().positive().nullable().optional(),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateAidProgramInput = z.infer<typeof updateAidProgramInputSchema>;

// Recipient input schemas
export const createRecipientInputSchema = z.object({
  nik: z.string().length(16), // NIK should be 16 digits
  full_name: z.string().min(1),
  birth_date: z.coerce.date(),
  birth_place: z.string().min(1),
  gender: z.enum(['laki_laki', 'perempuan']),
  address: z.string().min(1),
  phone: z.string().nullable().optional(),
  village: z.string().min(1),
  district: z.string().min(1),
  regency: z.string().min(1),
  province: z.string().min(1),
  postal_code: z.string().nullable().optional(),
  marital_status: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  monthly_income: z.number().nonnegative().nullable().optional(),
  family_members_count: z.number().int().positive().nullable().optional()
});

export type CreateRecipientInput = z.infer<typeof createRecipientInputSchema>;

// Application input schemas
export const createApplicationInputSchema = z.object({
  recipient_id: z.number(),
  aid_program_id: z.number(),
  notes: z.string().nullable().optional()
});

export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;

export const updateApplicationStatusInputSchema = z.object({
  id: z.number(),
  status: applicationStatusSchema,
  notes: z.string().nullable().optional(),
  rejection_reason: z.string().nullable().optional()
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusInputSchema>;

// Document input schemas
export const uploadDocumentInputSchema = z.object({
  recipient_id: z.number(),
  document_type: documentTypeSchema,
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().int().positive(),
  mime_type: z.string().min(1)
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

export const verifyDocumentInputSchema = z.object({
  id: z.number(),
  is_verified: z.boolean(),
  notes: z.string().nullable().optional()
});

export type VerifyDocumentInput = z.infer<typeof verifyDocumentInputSchema>;

// Survey input schemas
export const createSurveyInputSchema = z.object({
  application_id: z.number(),
  survey_date: z.coerce.date().nullable().optional(),
  house_condition: z.string().nullable().optional(),
  income_verification: z.string().nullable().optional(),
  family_condition: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
  photo_urls: z.array(z.string()).nullable().optional(),
  survey_notes: z.string().nullable().optional()
});

export type CreateSurveyInput = z.infer<typeof createSurveyInputSchema>;

export const updateSurveyInputSchema = z.object({
  id: z.number(),
  status: surveyStatusSchema.optional(),
  survey_date: z.coerce.date().nullable().optional(),
  house_condition: z.string().nullable().optional(),
  income_verification: z.string().nullable().optional(),
  family_condition: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
  photo_urls: z.array(z.string()).nullable().optional(),
  survey_notes: z.string().nullable().optional()
});

export type UpdateSurveyInput = z.infer<typeof updateSurveyInputSchema>;

// Query input schemas
export const getApplicationsInputSchema = z.object({
  status: applicationStatusSchema.optional(),
  aid_program_id: z.number().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetApplicationsInput = z.infer<typeof getApplicationsInputSchema>;

export const getRecipientsInputSchema = z.object({
  search: z.string().optional(),
  village: z.string().optional(),
  district: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetRecipientsInput = z.infer<typeof getRecipientsInputSchema>;

// Dashboard statistics schema
export const dashboardStatsSchema = z.object({
  total_applications: z.number().int(),
  applications_by_status: z.record(applicationStatusSchema, z.number().int()),
  total_recipients: z.number().int(),
  active_programs: z.number().int(),
  pending_surveys: z.number().int()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;