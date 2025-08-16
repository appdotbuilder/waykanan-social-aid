import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['admin_dinas', 'operator_staf', 'petugas_lapangan', 'masyarakat']);
export const applicationStatusEnum = pgEnum('application_status', ['diterima', 'diproses', 'disetujui', 'ditolak']);
export const documentTypeEnum = pgEnum('document_type', ['ktp', 'kk', 'surat_keterangan', 'foto', 'lainnya']);
export const surveyStatusEnum = pgEnum('survey_status', ['belum_survey', 'sedang_survey', 'selesai_survey']);
export const genderEnum = pgEnum('gender', ['laki_laki', 'perempuan']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  phone: text('phone'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Aid types table
export const aidTypesTable = pgTable('aid_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  requirements: text('requirements'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Aid programs table
export const aidProgramsTable = pgTable('aid_programs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  aid_type_id: integer('aid_type_id').notNull().references(() => aidTypesTable.id),
  budget_allocated: numeric('budget_allocated', { precision: 15, scale: 2 }),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Recipients table
export const recipientsTable = pgTable('recipients', {
  id: serial('id').primaryKey(),
  nik: text('nik').notNull().unique(),
  full_name: text('full_name').notNull(),
  birth_date: timestamp('birth_date').notNull(),
  birth_place: text('birth_place').notNull(),
  gender: genderEnum('gender').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  village: text('village').notNull(),
  district: text('district').notNull(),
  regency: text('regency').notNull(),
  province: text('province').notNull(),
  postal_code: text('postal_code'),
  marital_status: text('marital_status'),
  occupation: text('occupation'),
  monthly_income: numeric('monthly_income', { precision: 12, scale: 2 }),
  family_members_count: integer('family_members_count'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Applications table
export const applicationsTable = pgTable('applications', {
  id: serial('id').primaryKey(),
  registration_number: text('registration_number').notNull().unique(),
  recipient_id: integer('recipient_id').notNull().references(() => recipientsTable.id),
  aid_program_id: integer('aid_program_id').notNull().references(() => aidProgramsTable.id),
  status: applicationStatusEnum('status').notNull().default('diterima'),
  submission_date: timestamp('submission_date').defaultNow().notNull(),
  notes: text('notes'),
  processed_by: integer('processed_by').references(() => usersTable.id),
  processed_at: timestamp('processed_at'),
  approved_by: integer('approved_by').references(() => usersTable.id),
  approved_at: timestamp('approved_at'),
  rejection_reason: text('rejection_reason'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Documents table
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  recipient_id: integer('recipient_id').notNull().references(() => recipientsTable.id),
  document_type: documentTypeEnum('document_type').notNull(),
  file_name: text('file_name').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  is_verified: boolean('is_verified').notNull().default(false),
  verified_by: integer('verified_by').references(() => usersTable.id),
  verified_at: timestamp('verified_at'),
  notes: text('notes'),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull()
});

// Surveys table
export const surveysTable = pgTable('surveys', {
  id: serial('id').primaryKey(),
  application_id: integer('application_id').notNull().references(() => applicationsTable.id),
  surveyor_id: integer('surveyor_id').notNull().references(() => usersTable.id),
  status: surveyStatusEnum('status').notNull().default('belum_survey'),
  survey_date: timestamp('survey_date'),
  house_condition: text('house_condition'),
  income_verification: text('income_verification'),
  family_condition: text('family_condition'),
  recommendations: text('recommendations'),
  photo_urls: text('photo_urls'), // JSON array stored as text
  survey_notes: text('survey_notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  created_recipients: many(recipientsTable),
  processed_applications: many(applicationsTable, {
    relationName: 'processed_by'
  }),
  approved_applications: many(applicationsTable, {
    relationName: 'approved_by'
  }),
  verified_documents: many(documentsTable),
  surveys: many(surveysTable)
}));

export const aidTypesRelations = relations(aidTypesTable, ({ many }) => ({
  programs: many(aidProgramsTable)
}));

export const aidProgramsRelations = relations(aidProgramsTable, ({ one, many }) => ({
  aid_type: one(aidTypesTable, {
    fields: [aidProgramsTable.aid_type_id],
    references: [aidTypesTable.id]
  }),
  applications: many(applicationsTable)
}));

export const recipientsRelations = relations(recipientsTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [recipientsTable.created_by],
    references: [usersTable.id]
  }),
  applications: many(applicationsTable),
  documents: many(documentsTable)
}));

export const applicationsRelations = relations(applicationsTable, ({ one, many }) => ({
  recipient: one(recipientsTable, {
    fields: [applicationsTable.recipient_id],
    references: [recipientsTable.id]
  }),
  aid_program: one(aidProgramsTable, {
    fields: [applicationsTable.aid_program_id],
    references: [aidProgramsTable.id]
  }),
  processor: one(usersTable, {
    fields: [applicationsTable.processed_by],
    references: [usersTable.id],
    relationName: 'processed_by'
  }),
  approver: one(usersTable, {
    fields: [applicationsTable.approved_by],
    references: [usersTable.id],
    relationName: 'approved_by'
  }),
  surveys: many(surveysTable)
}));

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  recipient: one(recipientsTable, {
    fields: [documentsTable.recipient_id],
    references: [recipientsTable.id]
  }),
  verifier: one(usersTable, {
    fields: [documentsTable.verified_by],
    references: [usersTable.id]
  })
}));

export const surveysRelations = relations(surveysTable, ({ one }) => ({
  application: one(applicationsTable, {
    fields: [surveysTable.application_id],
    references: [applicationsTable.id]
  }),
  surveyor: one(usersTable, {
    fields: [surveysTable.surveyor_id],
    references: [usersTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type AidType = typeof aidTypesTable.$inferSelect;
export type NewAidType = typeof aidTypesTable.$inferInsert;

export type AidProgram = typeof aidProgramsTable.$inferSelect;
export type NewAidProgram = typeof aidProgramsTable.$inferInsert;

export type Recipient = typeof recipientsTable.$inferSelect;
export type NewRecipient = typeof recipientsTable.$inferInsert;

export type Application = typeof applicationsTable.$inferSelect;
export type NewApplication = typeof applicationsTable.$inferInsert;

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;

export type Survey = typeof surveysTable.$inferSelect;
export type NewSurvey = typeof surveysTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  aidTypes: aidTypesTable,
  aidPrograms: aidProgramsTable,
  recipients: recipientsTable,
  applications: applicationsTable,
  documents: documentsTable,
  surveys: surveysTable
};