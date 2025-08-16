import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  surveysTable, 
  usersTable, 
  aidTypesTable, 
  aidProgramsTable, 
  recipientsTable, 
  applicationsTable 
} from '../db/schema';
import { 
  type CreateSurveyInput, 
  type UpdateSurveyInput 
} from '../schema';
import { 
  createSurvey,
  getSurveysByApplication,
  getSurveysBySurveyor,
  getSurveyById,
  updateSurvey,
  getPendingSurveys,
  getCompletedSurveys,
  assignSurveyor
} from '../handlers/surveys';
import { eq } from 'drizzle-orm';

// Test data
const testSurveyor = {
  username: 'surveyor1',
  email: 'surveyor@test.com',
  password_hash: 'hashedpassword',
  full_name: 'Test Surveyor',
  role: 'petugas_lapangan' as const,
  phone: '081234567890',
  is_active: true
};

const testUser = {
  username: 'admin1',
  email: 'admin@test.com',
  password_hash: 'hashedpassword',
  full_name: 'Test Admin',
  role: 'admin_dinas' as const,
  is_active: true
};

const testAidType = {
  name: 'Bantuan Sosial Test',
  description: 'Bantuan untuk testing',
  is_active: true
};

const testRecipient = {
  nik: '1234567890123456',
  full_name: 'Test Recipient',
  birth_date: new Date('1990-01-01'),
  birth_place: 'Jakarta',
  gender: 'laki_laki' as const,
  address: 'Jl. Test No. 123',
  village: 'Test Village',
  district: 'Test District',
  regency: 'Test Regency',
  province: 'Test Province',
  created_by: 1
};

describe('Surveys Handler', () => {
  let surveyorId: number;
  let userId: number;
  let aidTypeId: number;
  let aidProgramId: number;
  let recipientId: number;
  let applicationId: number;

  beforeEach(async () => {
    await createDB();

    // Create test users
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    userId = userResult[0].id;

    const surveyorResult = await db.insert(usersTable).values(testSurveyor).returning().execute();
    surveyorId = surveyorResult[0].id;

    // Create test aid type
    const aidTypeResult = await db.insert(aidTypesTable).values(testAidType).returning().execute();
    aidTypeId = aidTypeResult[0].id;

    // Create test aid program
    const aidProgramResult = await db.insert(aidProgramsTable).values({
      name: 'Program Test',
      aid_type_id: aidTypeId,
      is_active: true
    }).returning().execute();
    aidProgramId = aidProgramResult[0].id;

    // Create test recipient
    const recipientResult = await db.insert(recipientsTable).values({
      ...testRecipient,
      created_by: userId
    }).returning().execute();
    recipientId = recipientResult[0].id;

    // Create test application
    const applicationResult = await db.insert(applicationsTable).values({
      registration_number: 'REG-TEST-001',
      recipient_id: recipientId,
      aid_program_id: aidProgramId,
      status: 'diterima'
    }).returning().execute();
    applicationId = applicationResult[0].id;
  });

  afterEach(resetDB);

  describe('createSurvey', () => {
    const createSurveyInput: CreateSurveyInput = {
      application_id: 0, // Will be set dynamically
      survey_date: new Date('2024-01-15'),
      house_condition: 'Rumah dalam kondisi baik',
      income_verification: 'Penghasilan sesuai laporan',
      family_condition: 'Keluarga harmonis',
      recommendations: 'Layak menerima bantuan',
      photo_urls: ['photo1.jpg', 'photo2.jpg'],
      survey_notes: 'Catatan survey lengkap'
    };

    it('should create a survey successfully', async () => {
      const input = { ...createSurveyInput, application_id: applicationId };
      const result = await createSurvey(input, surveyorId);

      expect(result.application_id).toBe(applicationId);
      expect(result.surveyor_id).toBe(surveyorId);
      expect(result.status).toBe('belum_survey');
      expect(result.house_condition).toBe(input.house_condition || null);
      expect(result.income_verification).toBe(input.income_verification || null);
      expect(result.family_condition).toBe(input.family_condition || null);
      expect(result.recommendations).toBe(input.recommendations || null);
      expect(result.photo_urls).toEqual(input.photo_urls || null);
      expect(result.survey_notes).toBe(input.survey_notes || null);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save survey to database', async () => {
      const input = { ...createSurveyInput, application_id: applicationId };
      const result = await createSurvey(input, surveyorId);

      const surveys = await db.select()
        .from(surveysTable)
        .where(eq(surveysTable.id, result.id))
        .execute();

      expect(surveys).toHaveLength(1);
      expect(surveys[0].application_id).toBe(applicationId);
      expect(surveys[0].surveyor_id).toBe(surveyorId);
      expect(surveys[0].status).toBe('belum_survey');
    });

    it('should throw error for non-existent application', async () => {
      const input = { ...createSurveyInput, application_id: 99999 };
      
      await expect(createSurvey(input, surveyorId)).rejects.toThrow(/application not found/i);
    });

    it('should throw error for invalid surveyor', async () => {
      const input = { ...createSurveyInput, application_id: applicationId };
      
      await expect(createSurvey(input, 99999)).rejects.toThrow(/surveyor not found/i);
    });

    it('should throw error for non-field officer', async () => {
      const input = { ...createSurveyInput, application_id: applicationId };
      
      await expect(createSurvey(input, userId)).rejects.toThrow(/surveyor not found/i);
    });
  });

  describe('getSurveysByApplication', () => {
    it('should return surveys for specific application', async () => {
      // Create test surveys
      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey'
      }).execute();

      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'sedang_survey'
      }).execute();

      const result = await getSurveysByApplication(applicationId);

      expect(result).toHaveLength(2);
      expect(result[0].application_id).toBe(applicationId);
      expect(result[1].application_id).toBe(applicationId);
    });

    it('should return empty array for application with no surveys', async () => {
      const result = await getSurveysByApplication(applicationId);
      expect(result).toHaveLength(0);
    });
  });

  describe('getSurveysBySurveyor', () => {
    it('should return surveys assigned to specific surveyor', async () => {
      // Create test surveys
      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey'
      }).execute();

      const result = await getSurveysBySurveyor(surveyorId);

      expect(result).toHaveLength(1);
      expect(result[0].surveyor_id).toBe(surveyorId);
    });

    it('should return empty array for surveyor with no assignments', async () => {
      const result = await getSurveysBySurveyor(surveyorId);
      expect(result).toHaveLength(0);
    });
  });

  describe('getSurveyById', () => {
    it('should return survey by ID', async () => {
      const surveyResult = await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey',
        photo_urls: JSON.stringify(['photo1.jpg', 'photo2.jpg'])
      }).returning().execute();

      const survey = await getSurveyById(surveyResult[0].id);

      expect(survey).toBeDefined();
      expect(survey!.id).toBe(surveyResult[0].id);
      expect(survey!.application_id).toBe(applicationId);
      expect(survey!.photo_urls).toEqual(['photo1.jpg', 'photo2.jpg']);
    });

    it('should return null for non-existent survey', async () => {
      const survey = await getSurveyById(99999);
      expect(survey).toBeNull();
    });
  });

  describe('updateSurvey', () => {
    it('should update survey successfully', async () => {
      // Create test survey
      const surveyResult = await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey'
      }).returning().execute();

      const updateInput: UpdateSurveyInput = {
        id: surveyResult[0].id,
        status: 'selesai_survey',
        house_condition: 'Updated house condition',
        recommendations: 'Updated recommendations',
        photo_urls: ['new_photo.jpg']
      };

      const result = await updateSurvey(updateInput);

      expect(result.id).toBe(surveyResult[0].id);
      expect(result.status).toBe('selesai_survey');
      expect(result.house_condition).toBe('Updated house condition');
      expect(result.recommendations).toBe('Updated recommendations');
      expect(result.photo_urls).toEqual(['new_photo.jpg']);
    });

    it('should throw error for non-existent survey', async () => {
      const updateInput: UpdateSurveyInput = {
        id: 99999,
        status: 'selesai_survey'
      };

      await expect(updateSurvey(updateInput)).rejects.toThrow(/survey not found/i);
    });
  });

  describe('getPendingSurveys', () => {
    it('should return pending and in-progress surveys', async () => {
      // Create test surveys with different statuses
      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey'
      }).execute();

      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'sedang_survey'
      }).execute();

      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'selesai_survey'
      }).execute();

      const result = await getPendingSurveys();

      expect(result).toHaveLength(2);
      expect(result.some(s => s.status === 'belum_survey')).toBe(true);
      expect(result.some(s => s.status === 'sedang_survey')).toBe(true);
      expect(result.some(s => s.status === 'selesai_survey')).toBe(false);
    });
  });

  describe('getCompletedSurveys', () => {
    it('should return only completed surveys', async () => {
      // Create test surveys with different statuses
      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey'
      }).execute();

      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'selesai_survey'
      }).execute();

      const result = await getCompletedSurveys();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('selesai_survey');
    });
  });

  describe('assignSurveyor', () => {
    it('should assign surveyor to application successfully', async () => {
      const result = await assignSurveyor(applicationId, surveyorId);

      expect(result.application_id).toBe(applicationId);
      expect(result.surveyor_id).toBe(surveyorId);
      expect(result.status).toBe('belum_survey');
      expect(result.id).toBeDefined();
    });

    it('should throw error for non-existent application', async () => {
      await expect(assignSurveyor(99999, surveyorId)).rejects.toThrow(/application not found/i);
    });

    it('should throw error for invalid surveyor', async () => {
      await expect(assignSurveyor(applicationId, 99999)).rejects.toThrow(/surveyor not found/i);
    });

    it('should throw error when survey already exists', async () => {
      // Create existing survey
      await db.insert(surveysTable).values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey'
      }).execute();

      await expect(assignSurveyor(applicationId, surveyorId)).rejects.toThrow(/survey already exists/i);
    });

    it('should save assignment to database', async () => {
      const result = await assignSurveyor(applicationId, surveyorId);

      const surveys = await db.select()
        .from(surveysTable)
        .where(eq(surveysTable.id, result.id))
        .execute();

      expect(surveys).toHaveLength(1);
      expect(surveys[0].application_id).toBe(applicationId);
      expect(surveys[0].surveyor_id).toBe(surveyorId);
    });
  });
});