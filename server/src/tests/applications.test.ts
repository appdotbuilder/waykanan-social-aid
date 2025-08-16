import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipientsTable, aidTypesTable, aidProgramsTable, applicationsTable, surveysTable } from '../db/schema';
import { type CreateApplicationInput, type UpdateApplicationStatusInput, type GetApplicationsInput } from '../schema';
import {
  createApplication,
  getApplications,
  getApplicationById,
  getApplicationByRegistrationNumber,
  updateApplicationStatus,
  getApplicationsByRecipient,
  getApplicationsByStatus,
  getPendingApplicationsForSurvey
} from '../handlers/applications';
import { eq, and } from 'drizzle-orm';

// Test data setup
const testUser = {
  username: 'test_admin',
  email: 'admin@test.com',
  password_hash: 'hashedpassword123',
  full_name: 'Test Admin',
  role: 'admin_dinas' as const,
  phone: '081234567890'
};

const testAidType = {
  name: 'Bantuan Pangan',
  description: 'Program bantuan sembako untuk keluarga kurang mampu',
  requirements: 'KTP, KK, Surat Keterangan Tidak Mampu'
};

const testRecipient = {
  nik: '1234567890123456',
  full_name: 'John Doe',
  birth_date: new Date('1990-01-01'),
  birth_place: 'Jakarta',
  gender: 'laki_laki' as const,
  address: 'Jl. Test No. 123',
  phone: '081234567890',
  village: 'Desa Test',
  district: 'Kecamatan Test',
  regency: 'Kabupaten Test',
  province: 'Provinsi Test',
  postal_code: '12345',
  marital_status: 'menikah',
  occupation: 'buruh',
  monthly_income: 1500000,
  family_members_count: 4
};

describe('Applications Handler', () => {
  let userId: number;
  let recipientId: number;
  let aidTypeId: number;
  let aidProgramId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test aid type
    const aidTypeResult = await db.insert(aidTypesTable)
      .values(testAidType)
      .returning()
      .execute();
    aidTypeId = aidTypeResult[0].id;

    // Create test aid program
    const aidProgramResult = await db.insert(aidProgramsTable)
      .values({
        name: 'Program Bantuan Sembako 2024',
        description: 'Program bantuan sembako tahun 2024',
        aid_type_id: aidTypeId,
        budget_allocated: '1000000000',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();
    aidProgramId = aidProgramResult[0].id;

    // Create test recipient
    const recipientResult = await db.insert(recipientsTable)
      .values({
        ...testRecipient,
        monthly_income: testRecipient.monthly_income.toString(),
        created_by: userId
      })
      .returning()
      .execute();
    recipientId = recipientResult[0].id;
  });

  afterEach(resetDB);

  describe('createApplication', () => {
    const testInput: CreateApplicationInput = {
      recipient_id: 0, // Will be set in test
      aid_program_id: 0, // Will be set in test
      notes: 'Test application notes'
    };

    it('should create an application successfully', async () => {
      const input = {
        ...testInput,
        recipient_id: recipientId,
        aid_program_id: aidProgramId
      };

      const result = await createApplication(input);

      expect(result.recipient_id).toEqual(recipientId);
      expect(result.aid_program_id).toEqual(aidProgramId);
      expect(result.status).toEqual('diterima');
      expect(result.notes).toEqual('Test application notes');
      expect(result.registration_number).toMatch(/^REG-\d+-[A-Z0-9]{5}$/);
      expect(result.id).toBeDefined();
      expect(result.submission_date).toBeInstanceOf(Date);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save application to database', async () => {
      const input = {
        ...testInput,
        recipient_id: recipientId,
        aid_program_id: aidProgramId
      };

      const result = await createApplication(input);

      const applications = await db.select()
        .from(applicationsTable)
        .where(eq(applicationsTable.id, result.id))
        .execute();

      expect(applications).toHaveLength(1);
      expect(applications[0].recipient_id).toEqual(recipientId);
      expect(applications[0].aid_program_id).toEqual(aidProgramId);
      expect(applications[0].status).toEqual('diterima');
    });

    it('should throw error for non-existent recipient', async () => {
      const input = {
        ...testInput,
        recipient_id: 999999,
        aid_program_id: aidProgramId
      };

      await expect(createApplication(input)).rejects.toThrow(/recipient not found/i);
    });

    it('should throw error for non-existent aid program', async () => {
      const input = {
        ...testInput,
        recipient_id: recipientId,
        aid_program_id: 999999
      };

      await expect(createApplication(input)).rejects.toThrow(/aid program not found/i);
    });
  });

  describe('getApplications', () => {
    let applicationId1: number;
    let applicationId2: number;

    beforeEach(async () => {
      // Create test applications
      const app1 = await db.insert(applicationsTable)
        .values({
          registration_number: 'REG-TEST-001',
          recipient_id: recipientId,
          aid_program_id: aidProgramId,
          status: 'diterima',
          notes: 'First application'
        })
        .returning()
        .execute();
      applicationId1 = app1[0].id;

      const app2 = await db.insert(applicationsTable)
        .values({
          registration_number: 'REG-TEST-002',
          recipient_id: recipientId,
          aid_program_id: aidProgramId,
          status: 'diproses',
          notes: 'Second application'
        })
        .returning()
        .execute();
      applicationId2 = app2[0].id;
    });

    it('should fetch all applications without filters', async () => {
      const results = await getApplications();

      expect(results).toHaveLength(2);
      expect(results[0].id).toEqual(applicationId2); // Should be ordered by created_at desc
      expect(results[1].id).toEqual(applicationId1);
    });

    it('should filter applications by status', async () => {
      const input: GetApplicationsInput = {
        status: 'diterima'
      };

      const results = await getApplications(input);

      expect(results).toHaveLength(1);
      expect(results[0].id).toEqual(applicationId1);
      expect(results[0].status).toEqual('diterima');
    });

    it('should filter applications by aid program', async () => {
      const input: GetApplicationsInput = {
        aid_program_id: aidProgramId
      };

      const results = await getApplications(input);

      expect(results).toHaveLength(2);
      results.forEach(app => {
        expect(app.aid_program_id).toEqual(aidProgramId);
      });
    });

    it('should apply pagination correctly', async () => {
      const input: GetApplicationsInput = {
        limit: 1,
        offset: 1
      };

      const results = await getApplications(input);

      expect(results).toHaveLength(1);
      expect(results[0].id).toEqual(applicationId1);
    });

    it('should combine multiple filters', async () => {
      const input: GetApplicationsInput = {
        status: 'diproses',
        aid_program_id: aidProgramId,
        limit: 10,
        offset: 0
      };

      const results = await getApplications(input);

      expect(results).toHaveLength(1);
      expect(results[0].status).toEqual('diproses');
      expect(results[0].aid_program_id).toEqual(aidProgramId);
    });
  });

  describe('getApplicationById', () => {
    let applicationId: number;

    beforeEach(async () => {
      const app = await db.insert(applicationsTable)
        .values({
          registration_number: 'REG-TEST-001',
          recipient_id: recipientId,
          aid_program_id: aidProgramId,
          status: 'diterima',
          notes: 'Test application'
        })
        .returning()
        .execute();
      applicationId = app[0].id;
    });

    it('should fetch application by ID', async () => {
      const result = await getApplicationById(applicationId);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(applicationId);
      expect(result!.registration_number).toEqual('REG-TEST-001');
      expect(result!.status).toEqual('diterima');
    });

    it('should return null for non-existent ID', async () => {
      const result = await getApplicationById(999999);

      expect(result).toBeNull();
    });
  });

  describe('getApplicationByRegistrationNumber', () => {
    let applicationId: number;

    beforeEach(async () => {
      const app = await db.insert(applicationsTable)
        .values({
          registration_number: 'REG-TEST-UNIQUE',
          recipient_id: recipientId,
          aid_program_id: aidProgramId,
          status: 'diterima',
          notes: 'Test application'
        })
        .returning()
        .execute();
      applicationId = app[0].id;
    });

    it('should fetch application by registration number', async () => {
      const result = await getApplicationByRegistrationNumber('REG-TEST-UNIQUE');

      expect(result).toBeDefined();
      expect(result!.id).toEqual(applicationId);
      expect(result!.registration_number).toEqual('REG-TEST-UNIQUE');
    });

    it('should return null for non-existent registration number', async () => {
      const result = await getApplicationByRegistrationNumber('REG-NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('updateApplicationStatus', () => {
    let applicationId: number;

    beforeEach(async () => {
      const app = await db.insert(applicationsTable)
        .values({
          registration_number: 'REG-TEST-001',
          recipient_id: recipientId,
          aid_program_id: aidProgramId,
          status: 'diterima',
          notes: 'Initial application'
        })
        .returning()
        .execute();
      applicationId = app[0].id;
    });

    it('should update application status to approved', async () => {
      const input: UpdateApplicationStatusInput = {
        id: applicationId,
        status: 'disetujui',
        notes: 'Application approved'
      };

      const result = await updateApplicationStatus(input, userId);

      expect(result.status).toEqual('disetujui');
      expect(result.notes).toEqual('Application approved');
      expect(result.processed_by).toEqual(userId);
      expect(result.approved_by).toEqual(userId);
      expect(result.processed_at).toBeInstanceOf(Date);
      expect(result.approved_at).toBeInstanceOf(Date);
      expect(result.rejection_reason).toBeNull();
    });

    it('should update application status to rejected', async () => {
      const input: UpdateApplicationStatusInput = {
        id: applicationId,
        status: 'ditolak',
        rejection_reason: 'Documents incomplete'
      };

      const result = await updateApplicationStatus(input, userId);

      expect(result.status).toEqual('ditolak');
      expect(result.rejection_reason).toEqual('Documents incomplete');
      expect(result.processed_by).toEqual(userId);
      expect(result.approved_by).toBeNull();
      expect(result.approved_at).toBeNull();
    });

    it('should throw error for non-existent application', async () => {
      const input: UpdateApplicationStatusInput = {
        id: 999999,
        status: 'disetujui'
      };

      await expect(updateApplicationStatus(input, userId)).rejects.toThrow(/application not found/i);
    });
  });

  describe('getApplicationsByRecipient', () => {
    beforeEach(async () => {
      // Create multiple applications for the same recipient
      await db.insert(applicationsTable)
        .values([
          {
            registration_number: 'REG-RECIPIENT-001',
            recipient_id: recipientId,
            aid_program_id: aidProgramId,
            status: 'diterima',
            notes: 'First application'
          },
          {
            registration_number: 'REG-RECIPIENT-002',
            recipient_id: recipientId,
            aid_program_id: aidProgramId,
            status: 'diproses',
            notes: 'Second application'
          }
        ])
        .execute();
    });

    it('should fetch all applications for a recipient', async () => {
      const results = await getApplicationsByRecipient(recipientId);

      expect(results).toHaveLength(2);
      results.forEach(app => {
        expect(app.recipient_id).toEqual(recipientId);
      });
    });

    it('should return empty array for recipient with no applications', async () => {
      const results = await getApplicationsByRecipient(999999);

      expect(results).toHaveLength(0);
    });
  });

  describe('getApplicationsByStatus', () => {
    beforeEach(async () => {
      await db.insert(applicationsTable)
        .values([
          {
            registration_number: 'REG-STATUS-001',
            recipient_id: recipientId,
            aid_program_id: aidProgramId,
            status: 'diterima',
            notes: 'Received application'
          },
          {
            registration_number: 'REG-STATUS-002',
            recipient_id: recipientId,
            aid_program_id: aidProgramId,
            status: 'diproses',
            notes: 'Processing application'
          }
        ])
        .execute();
    });

    it('should fetch applications by status', async () => {
      const results = await getApplicationsByStatus('diterima');

      expect(results).toHaveLength(1);
      expect(results[0].status).toEqual('diterima');
      expect(results[0].registration_number).toEqual('REG-STATUS-001');
    });
  });

  describe('getPendingApplicationsForSurvey', () => {
    let applicationId: number;

    beforeEach(async () => {
      // Create an approved application
      const app = await db.insert(applicationsTable)
        .values({
          registration_number: 'REG-SURVEY-001',
          recipient_id: recipientId,
          aid_program_id: aidProgramId,
          status: 'disetujui',
          approved_by: userId,
          approved_at: new Date()
        })
        .returning()
        .execute();
      applicationId = app[0].id;

      // Create a survey with pending status
      await db.insert(surveysTable)
        .values({
          application_id: applicationId,
          surveyor_id: userId,
          status: 'belum_survey'
        })
        .execute();
    });

    it('should fetch applications pending survey', async () => {
      const results = await getPendingApplicationsForSurvey();

      expect(results).toHaveLength(1);
      expect(results[0].id).toEqual(applicationId);
      expect(results[0].status).toEqual('disetujui');
    });
  });
});