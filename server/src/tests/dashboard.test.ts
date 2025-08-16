import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  aidTypesTable, 
  aidProgramsTable, 
  recipientsTable, 
  applicationsTable,
  surveysTable 
} from '../db/schema';
import {
  getDashboardStats,
  getApplicationTrends,
  getLocationStats,
  getProgramStats,
  getStaffWorkload
} from '../handlers/dashboard';

describe('Dashboard Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      // Create prerequisite data
      const userResult = await db.insert(usersTable).values({
        username: 'admin1',
        email: 'admin1@test.com',
        password_hash: 'hashed',
        full_name: 'Admin User',
        role: 'admin_dinas'
      }).returning().execute();

      const aidTypeResult = await db.insert(aidTypesTable).values({
        name: 'Bantuan Sosial',
        description: 'Program bantuan sosial'
      }).returning().execute();

      const aidProgramResult = await db.insert(aidProgramsTable).values({
        name: 'Program Test',
        aid_type_id: aidTypeResult[0].id
      }).returning().execute();

      const recipientResult = await db.insert(recipientsTable).values({
        nik: '1234567890123456',
        full_name: 'Test Recipient',
        birth_date: new Date('1990-01-01'),
        birth_place: 'Jakarta',
        gender: 'laki_laki',
        address: 'Test Address',
        village: 'Test Village',
        district: 'Test District',
        regency: 'Test Regency',
        province: 'Test Province',
        created_by: userResult[0].id
      }).returning().execute();

      // Create applications with different statuses
      await db.insert(applicationsTable).values([
        {
          registration_number: 'APP001',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'diterima'
        },
        {
          registration_number: 'APP002',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'diproses'
        },
        {
          registration_number: 'APP003',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'disetujui'
        }
      ]).execute();

      const applicationResult = await db.insert(applicationsTable).values({
        registration_number: 'APP004',
        recipient_id: recipientResult[0].id,
        aid_program_id: aidProgramResult[0].id,
        status: 'diterima'
      }).returning().execute();

      // Create surveys
      await db.insert(surveysTable).values({
        application_id: applicationResult[0].id,
        surveyor_id: userResult[0].id,
        status: 'belum_survey'
      }).execute();

      const stats = await getDashboardStats();

      // Verify basic structure
      expect(stats.total_applications).toEqual(4);
      expect(stats.total_recipients).toEqual(1);
      expect(stats.active_programs).toEqual(1);
      expect(stats.pending_surveys).toEqual(1);

      // Verify applications by status
      expect(stats.applications_by_status.diterima).toEqual(2);
      expect(stats.applications_by_status.diproses).toEqual(1);
      expect(stats.applications_by_status.disetujui).toEqual(1);
      expect(stats.applications_by_status.ditolak).toEqual(0);
    });

    it('should handle empty database', async () => {
      const stats = await getDashboardStats();

      expect(stats.total_applications).toEqual(0);
      expect(stats.total_recipients).toEqual(0);
      expect(stats.active_programs).toEqual(0);
      expect(stats.pending_surveys).toEqual(0);
      expect(stats.applications_by_status.diterima).toEqual(0);
      expect(stats.applications_by_status.diproses).toEqual(0);
      expect(stats.applications_by_status.disetujui).toEqual(0);
      expect(stats.applications_by_status.ditolak).toEqual(0);
    });
  });

  describe('getApplicationTrends', () => {
    it('should return application trends over specified days', async () => {
      // Create prerequisite data
      const userResult = await db.insert(usersTable).values({
        username: 'admin1',
        email: 'admin1@test.com',
        password_hash: 'hashed',
        full_name: 'Admin User',
        role: 'admin_dinas'
      }).returning().execute();

      const aidTypeResult = await db.insert(aidTypesTable).values({
        name: 'Bantuan Sosial',
        description: 'Program bantuan sosial'
      }).returning().execute();

      const aidProgramResult = await db.insert(aidProgramsTable).values({
        name: 'Program Test',
        aid_type_id: aidTypeResult[0].id
      }).returning().execute();

      const recipientResult = await db.insert(recipientsTable).values({
        nik: '1234567890123456',
        full_name: 'Test Recipient',
        birth_date: new Date('1990-01-01'),
        birth_place: 'Jakarta',
        gender: 'laki_laki',
        address: 'Test Address',
        village: 'Test Village',
        district: 'Test District',
        regency: 'Test Regency',
        province: 'Test Province',
        created_by: userResult[0].id
      }).returning().execute();

      // Create applications with recent submission dates
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await db.insert(applicationsTable).values([
        {
          registration_number: 'APP001',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'diterima',
          submission_date: today
        },
        {
          registration_number: 'APP002',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'diterima',
          submission_date: today
        },
        {
          registration_number: 'APP003',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'diterima',
          submission_date: yesterday
        }
      ]).execute();

      const trends = await getApplicationTrends(7);

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      
      // Check structure of returned data
      trends.forEach(trend => {
        expect(typeof trend.date).toBe('string');
        expect(typeof trend.count).toBe('number');
        expect(trend.count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return empty array for no applications in period', async () => {
      const trends = await getApplicationTrends(30);
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toEqual(0);
    });
  });

  describe('getLocationStats', () => {
    it('should return recipient distribution by location', async () => {
      // Create prerequisite data
      const userResult = await db.insert(usersTable).values({
        username: 'admin1',
        email: 'admin1@test.com',
        password_hash: 'hashed',
        full_name: 'Admin User',
        role: 'admin_dinas'
      }).returning().execute();

      // Create recipients in different locations
      await db.insert(recipientsTable).values([
        {
          nik: '1234567890123456',
          full_name: 'Recipient 1',
          birth_date: new Date('1990-01-01'),
          birth_place: 'Jakarta',
          gender: 'laki_laki',
          address: 'Address 1',
          village: 'Village A',
          district: 'District 1',
          regency: 'Regency 1',
          province: 'Province 1',
          created_by: userResult[0].id
        },
        {
          nik: '1234567890123457',
          full_name: 'Recipient 2',
          birth_date: new Date('1991-01-01'),
          birth_place: 'Jakarta',
          gender: 'perempuan',
          address: 'Address 2',
          village: 'Village A',
          district: 'District 1',
          regency: 'Regency 1',
          province: 'Province 1',
          created_by: userResult[0].id
        },
        {
          nik: '1234567890123458',
          full_name: 'Recipient 3',
          birth_date: new Date('1992-01-01'),
          birth_place: 'Jakarta',
          gender: 'laki_laki',
          address: 'Address 3',
          village: 'Village B',
          district: 'District 2',
          regency: 'Regency 1',
          province: 'Province 1',
          created_by: userResult[0].id
        }
      ]).execute();

      const locationStats = await getLocationStats();

      expect(Array.isArray(locationStats)).toBe(true);
      expect(locationStats.length).toEqual(2); // Two different village-district combinations

      locationStats.forEach(stat => {
        expect(typeof stat.village).toBe('string');
        expect(typeof stat.district).toBe('string');
        expect(typeof stat.count).toBe('number');
        expect(stat.count).toBeGreaterThan(0);
      });

      // Find Village A stats
      const villageAStats = locationStats.find(stat => stat.village === 'Village A');
      expect(villageAStats).toBeDefined();
      expect(villageAStats!.count).toEqual(2);
    });

    it('should return empty array for no recipients', async () => {
      const locationStats = await getLocationStats();
      expect(Array.isArray(locationStats)).toBe(true);
      expect(locationStats.length).toEqual(0);
    });
  });

  describe('getProgramStats', () => {
    it('should return program statistics with application and approval counts', async () => {
      // Create prerequisite data
      const userResult = await db.insert(usersTable).values({
        username: 'admin1',
        email: 'admin1@test.com',
        password_hash: 'hashed',
        full_name: 'Admin User',
        role: 'admin_dinas'
      }).returning().execute();

      const aidTypeResult = await db.insert(aidTypesTable).values({
        name: 'Bantuan Sosial',
        description: 'Program bantuan sosial'
      }).returning().execute();

      const aidProgramResult = await db.insert(aidProgramsTable).values([
        {
          name: 'Program A',
          aid_type_id: aidTypeResult[0].id
        },
        {
          name: 'Program B',
          aid_type_id: aidTypeResult[0].id
        }
      ]).returning().execute();

      const recipientResult = await db.insert(recipientsTable).values({
        nik: '1234567890123456',
        full_name: 'Test Recipient',
        birth_date: new Date('1990-01-01'),
        birth_place: 'Jakarta',
        gender: 'laki_laki',
        address: 'Test Address',
        village: 'Test Village',
        district: 'Test District',
        regency: 'Test Regency',
        province: 'Test Province',
        created_by: userResult[0].id
      }).returning().execute();

      // Create applications for Program A
      await db.insert(applicationsTable).values([
        {
          registration_number: 'APP001',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'disetujui'
        },
        {
          registration_number: 'APP002',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'disetujui'
        },
        {
          registration_number: 'APP003',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'ditolak'
        }
      ]).execute();

      // Create one application for Program B
      await db.insert(applicationsTable).values({
        registration_number: 'APP004',
        recipient_id: recipientResult[0].id,
        aid_program_id: aidProgramResult[1].id,
        status: 'diterima'
      }).execute();

      const programStats = await getProgramStats();

      expect(Array.isArray(programStats)).toBe(true);
      expect(programStats.length).toEqual(2);

      programStats.forEach(stat => {
        expect(typeof stat.program_name).toBe('string');
        expect(typeof stat.application_count).toBe('number');
        expect(typeof stat.approved_count).toBe('number');
        expect(stat.application_count).toBeGreaterThanOrEqual(stat.approved_count);
      });

      // Find Program A stats
      const programAStats = programStats.find(stat => stat.program_name === 'Program A');
      expect(programAStats).toBeDefined();
      expect(programAStats!.application_count).toEqual(3);
      expect(programAStats!.approved_count).toEqual(2);

      // Find Program B stats
      const programBStats = programStats.find(stat => stat.program_name === 'Program B');
      expect(programBStats).toBeDefined();
      expect(programBStats!.application_count).toEqual(1);
      expect(programBStats!.approved_count).toEqual(0);
    });

    it('should include programs with no applications', async () => {
      // Create program with no applications
      const aidTypeResult = await db.insert(aidTypesTable).values({
        name: 'Bantuan Sosial',
        description: 'Program bantuan sosial'
      }).returning().execute();

      await db.insert(aidProgramsTable).values({
        name: 'Program Empty',
        aid_type_id: aidTypeResult[0].id
      }).execute();

      const programStats = await getProgramStats();

      expect(Array.isArray(programStats)).toBe(true);
      expect(programStats.length).toEqual(1);
      expect(programStats[0].program_name).toEqual('Program Empty');
      expect(programStats[0].application_count).toEqual(0);
      expect(programStats[0].approved_count).toEqual(0);
    });
  });

  describe('getStaffWorkload', () => {
    it('should return staff workload with pending tasks', async () => {
      // Create staff users
      const staffResult = await db.insert(usersTable).values([
        {
          username: 'staff1',
          email: 'staff1@test.com',
          password_hash: 'hashed',
          full_name: 'Staff One',
          role: 'operator_staf'
        },
        {
          username: 'staff2',
          email: 'staff2@test.com',
          password_hash: 'hashed',
          full_name: 'Staff Two',
          role: 'petugas_lapangan'
        }
      ]).returning().execute();

      const aidTypeResult = await db.insert(aidTypesTable).values({
        name: 'Bantuan Sosial',
        description: 'Program bantuan sosial'
      }).returning().execute();

      const aidProgramResult = await db.insert(aidProgramsTable).values({
        name: 'Program Test',
        aid_type_id: aidTypeResult[0].id
      }).returning().execute();

      const recipientResult = await db.insert(recipientsTable).values({
        nik: '1234567890123456',
        full_name: 'Test Recipient',
        birth_date: new Date('1990-01-01'),
        birth_place: 'Jakarta',
        gender: 'laki_laki',
        address: 'Test Address',
        village: 'Test Village',
        district: 'Test District',
        regency: 'Test Regency',
        province: 'Test Province',
        created_by: staffResult[0].id
      }).returning().execute();

      // Create unprocessed applications
      const applicationResult = await db.insert(applicationsTable).values([
        {
          registration_number: 'APP001',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'diterima' // Unprocessed
        },
        {
          registration_number: 'APP002',
          recipient_id: recipientResult[0].id,
          aid_program_id: aidProgramResult[0].id,
          status: 'diterima' // Unprocessed
        }
      ]).returning().execute();

      // Create surveys for field staff
      await db.insert(surveysTable).values({
        application_id: applicationResult[0].id,
        surveyor_id: staffResult[1].id, // Field staff
        status: 'belum_survey'
      }).execute();

      const staffWorkload = await getStaffWorkload();

      expect(Array.isArray(staffWorkload)).toBe(true);

      staffWorkload.forEach(staff => {
        expect(typeof staff.staff_name).toBe('string');
        expect(typeof staff.role).toBe('string');
        expect(typeof staff.pending_tasks).toBe('number');
        expect(['operator_staf', 'petugas_lapangan'].includes(staff.role)).toBe(true);
        expect(staff.pending_tasks).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return empty array when no active staff exist', async () => {
      const staffWorkload = await getStaffWorkload();
      expect(Array.isArray(staffWorkload)).toBe(true);
      expect(staffWorkload.length).toEqual(0);
    });

    it('should exclude inactive staff', async () => {
      // Create inactive staff
      await db.insert(usersTable).values({
        username: 'inactive_staff',
        email: 'inactive@test.com',
        password_hash: 'hashed',
        full_name: 'Inactive Staff',
        role: 'operator_staf',
        is_active: false
      }).execute();

      const staffWorkload = await getStaffWorkload();
      expect(staffWorkload.length).toEqual(0);
    });
  });
});