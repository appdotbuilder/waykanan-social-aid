import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createAidTypeInputSchema,
  updateAidTypeInputSchema,
  createAidProgramInputSchema,
  updateAidProgramInputSchema,
  createRecipientInputSchema,
  getRecipientsInputSchema,
  createApplicationInputSchema,
  updateApplicationStatusInputSchema,
  getApplicationsInputSchema,
  uploadDocumentInputSchema,
  verifyDocumentInputSchema,
  createSurveyInputSchema,
  updateSurveyInputSchema
} from './schema';

// Import handlers
import { createUser, loginUser, getCurrentUser } from './handlers/auth';
import { createAidType, getAidTypes, getAidTypeById, updateAidType, deleteAidType } from './handlers/aid_types';
import { createAidProgram, getAidPrograms, getAidProgramById, getActiveAidPrograms, updateAidProgram, deleteAidProgram } from './handlers/aid_programs';
import { createRecipient, getRecipients, getRecipientById, getRecipientByNik, updateRecipient, getRecipientsByLocation } from './handlers/recipients';
import { createApplication, getApplications, getApplicationById, getApplicationByRegistrationNumber, updateApplicationStatus, getApplicationsByRecipient, getApplicationsByStatus, getPendingApplicationsForSurvey } from './handlers/applications';
import { uploadDocument, getDocumentsByRecipient, getDocumentById, verifyDocument, getPendingDocuments, getDocumentsByType, deleteDocument } from './handlers/documents';
import { createSurvey, getSurveysByApplication, getSurveysBySurveyor, getSurveyById, updateSurvey, getPendingSurveys, getCompletedSurveys, assignSurveyor } from './handlers/surveys';
import { getDashboardStats, getApplicationTrends, getLocationStats, getProgramStats, getStaffWorkload } from './handlers/dashboard';
import { getUsers, getUserById, getUsersByRole, updateUser, deactivateUser, activateUser, changePassword, getStaffMembers } from './handlers/users';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  auth: router({
    register: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => createUser(input)),
    
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => loginUser(input)),
    
    getCurrentUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => getCurrentUser(input.userId)),
  }),

  // User management routes (admin only)
  users: router({
    getAll: publicProcedure
      .query(() => getUsers()),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getUserById(input.id)),
    
    getByRole: publicProcedure
      .input(z.object({ role: z.enum(['admin_dinas', 'operator_staf', 'petugas_lapangan', 'masyarakat']) }))
      .query(({ input }) => getUsersByRole(input.role)),
    
    getStaffMembers: publicProcedure
      .query(() => getStaffMembers()),
    
    update: publicProcedure
      .input(z.object({ id: z.number() }).merge(createUserInputSchema.partial()))
      .mutation(({ input }) => updateUser(input.id, input)),
    
    deactivate: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deactivateUser(input.id)),
    
    activate: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => activateUser(input.id)),
    
    changePassword: publicProcedure
      .input(z.object({ id: z.number(), newPassword: z.string().min(6) }))
      .mutation(({ input }) => changePassword(input.id, input.newPassword)),
  }),

  // Aid type management routes
  aidTypes: router({
    create: publicProcedure
      .input(createAidTypeInputSchema)
      .mutation(({ input }) => createAidType(input)),
    
    getAll: publicProcedure
      .query(() => getAidTypes()),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getAidTypeById(input.id)),
    
    update: publicProcedure
      .input(updateAidTypeInputSchema)
      .mutation(({ input }) => updateAidType(input)),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteAidType(input.id)),
  }),

  // Aid program management routes
  aidPrograms: router({
    create: publicProcedure
      .input(createAidProgramInputSchema)
      .mutation(({ input }) => createAidProgram(input)),
    
    getAll: publicProcedure
      .query(() => getAidPrograms()),
    
    getActive: publicProcedure
      .query(() => getActiveAidPrograms()),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getAidProgramById(input.id)),
    
    update: publicProcedure
      .input(updateAidProgramInputSchema)
      .mutation(({ input }) => updateAidProgram(input)),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteAidProgram(input.id)),
  }),

  // Recipient management routes
  recipients: router({
    create: publicProcedure
      .input(createRecipientInputSchema.extend({ createdBy: z.number() }))
      .mutation(({ input }) => createRecipient(input, input.createdBy)),
    
    getAll: publicProcedure
      .input(getRecipientsInputSchema.optional())
      .query(({ input }) => getRecipients(input)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getRecipientById(input.id)),
    
    getByNik: publicProcedure
      .input(z.object({ nik: z.string() }))
      .query(({ input }) => getRecipientByNik(input.nik)),
    
    update: publicProcedure
      .input(z.object({ id: z.number() }).merge(createRecipientInputSchema.partial()))
      .mutation(({ input }) => updateRecipient(input.id, input)),
    
    getByLocation: publicProcedure
      .input(z.object({ village: z.string().optional(), district: z.string().optional() }))
      .query(({ input }) => getRecipientsByLocation(input.village, input.district)),
  }),

  // Application management routes
  applications: router({
    create: publicProcedure
      .input(createApplicationInputSchema)
      .mutation(({ input }) => createApplication(input)),
    
    getAll: publicProcedure
      .input(getApplicationsInputSchema.optional())
      .query(({ input }) => getApplications(input)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getApplicationById(input.id)),
    
    getByRegistrationNumber: publicProcedure
      .input(z.object({ registrationNumber: z.string() }))
      .query(({ input }) => getApplicationByRegistrationNumber(input.registrationNumber)),
    
    updateStatus: publicProcedure
      .input(updateApplicationStatusInputSchema.extend({ updatedBy: z.number() }))
      .mutation(({ input }) => updateApplicationStatus(input, input.updatedBy)),
    
    getByRecipient: publicProcedure
      .input(z.object({ recipientId: z.number() }))
      .query(({ input }) => getApplicationsByRecipient(input.recipientId)),
    
    getByStatus: publicProcedure
      .input(z.object({ status: z.enum(['diterima', 'diproses', 'disetujui', 'ditolak']) }))
      .query(({ input }) => getApplicationsByStatus(input.status)),
    
    getPendingForSurvey: publicProcedure
      .query(() => getPendingApplicationsForSurvey()),
  }),

  // Document management routes
  documents: router({
    upload: publicProcedure
      .input(uploadDocumentInputSchema)
      .mutation(({ input }) => uploadDocument(input)),
    
    getByRecipient: publicProcedure
      .input(z.object({ recipientId: z.number() }))
      .query(({ input }) => getDocumentsByRecipient(input.recipientId)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getDocumentById(input.id)),
    
    verify: publicProcedure
      .input(verifyDocumentInputSchema.extend({ verifiedBy: z.number() }))
      .mutation(({ input }) => verifyDocument(input, input.verifiedBy)),
    
    getPending: publicProcedure
      .query(() => getPendingDocuments()),
    
    getByType: publicProcedure
      .input(z.object({ documentType: z.enum(['ktp', 'kk', 'surat_keterangan', 'foto', 'lainnya']) }))
      .query(({ input }) => getDocumentsByType(input.documentType)),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteDocument(input.id)),
  }),

  // Survey management routes
  surveys: router({
    create: publicProcedure
      .input(createSurveyInputSchema.extend({ surveyorId: z.number() }))
      .mutation(({ input }) => createSurvey(input, input.surveyorId)),
    
    getByApplication: publicProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(({ input }) => getSurveysByApplication(input.applicationId)),
    
    getBySurveyor: publicProcedure
      .input(z.object({ surveyorId: z.number() }))
      .query(({ input }) => getSurveysBySurveyor(input.surveyorId)),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getSurveyById(input.id)),
    
    update: publicProcedure
      .input(updateSurveyInputSchema)
      .mutation(({ input }) => updateSurvey(input)),
    
    getPending: publicProcedure
      .query(() => getPendingSurveys()),
    
    getCompleted: publicProcedure
      .query(() => getCompletedSurveys()),
    
    assignSurveyor: publicProcedure
      .input(z.object({ applicationId: z.number(), surveyorId: z.number() }))
      .mutation(({ input }) => assignSurveyor(input.applicationId, input.surveyorId)),
  }),

  // Dashboard and reporting routes
  dashboard: router({
    getStats: publicProcedure
      .query(() => getDashboardStats()),
    
    getApplicationTrends: publicProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(({ input }) => getApplicationTrends(input.days)),
    
    getLocationStats: publicProcedure
      .query(() => getLocationStats()),
    
    getProgramStats: publicProcedure
      .query(() => getProgramStats()),
    
    getStaffWorkload: publicProcedure
      .query(() => getStaffWorkload()),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();