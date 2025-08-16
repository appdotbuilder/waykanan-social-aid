import { db } from '../db';
import { applicationsTable, recipientsTable, aidProgramsTable, aidTypesTable, surveysTable } from '../db/schema';
import { type CreateApplicationInput, type UpdateApplicationStatusInput, type GetApplicationsInput, type Application } from '../schema';
import { eq, and, desc, SQL } from 'drizzle-orm';

export async function createApplication(input: CreateApplicationInput): Promise<Application> {
  try {
    // Verify that recipient exists
    const recipient = await db.select()
      .from(recipientsTable)
      .where(eq(recipientsTable.id, input.recipient_id))
      .execute();

    if (recipient.length === 0) {
      throw new Error('Recipient not found');
    }

    // Verify that aid program exists
    const aidProgram = await db.select()
      .from(aidProgramsTable)
      .where(eq(aidProgramsTable.id, input.aid_program_id))
      .execute();

    if (aidProgram.length === 0) {
      throw new Error('Aid program not found');
    }

    // Generate registration number
    const registrationNumber = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Insert application record
    const result = await db.insert(applicationsTable)
      .values({
        registration_number: registrationNumber,
        recipient_id: input.recipient_id,
        aid_program_id: input.aid_program_id,
        status: 'diterima',
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Application creation failed:', error);
    throw error;
  }
}

export async function getApplications(input?: GetApplicationsInput): Promise<Application[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input?.status) {
      conditions.push(eq(applicationsTable.status, input.status));
    }

    if (input?.aid_program_id) {
      conditions.push(eq(applicationsTable.aid_program_id, input.aid_program_id));
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(applicationsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(applicationsTable.created_at))
          .limit(input?.limit || 100)
          .offset(input?.offset || 0)
          .execute()
      : await db.select()
          .from(applicationsTable)
          .orderBy(desc(applicationsTable.created_at))
          .limit(input?.limit || 100)
          .offset(input?.offset || 0)
          .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    throw error;
  }
}

export async function getApplicationById(id: number): Promise<Application | null> {
  try {
    const results = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, id))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch application by ID:', error);
    throw error;
  }
}

export async function getApplicationByRegistrationNumber(regNumber: string): Promise<Application | null> {
  try {
    const results = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.registration_number, regNumber))
      .execute();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Failed to fetch application by registration number:', error);
    throw error;
  }
}

export async function updateApplicationStatus(input: UpdateApplicationStatusInput, updatedBy: number): Promise<Application> {
  try {
    // Verify application exists
    const existing = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error('Application not found');
    }

    // Prepare update values
    const updateValues: any = {
      status: input.status,
      notes: input.notes !== undefined ? input.notes : existing[0].notes,
      processed_by: updatedBy,
      processed_at: new Date(),
      updated_at: new Date()
    };

    // Set approval/rejection specific fields
    if (input.status === 'disetujui') {
      updateValues.approved_by = updatedBy;
      updateValues.approved_at = new Date();
      updateValues.rejection_reason = null;
    } else if (input.status === 'ditolak') {
      updateValues.rejection_reason = input.rejection_reason || null;
      updateValues.approved_by = null;
      updateValues.approved_at = null;
    }

    // Update the application
    const result = await db.update(applicationsTable)
      .set(updateValues)
      .where(eq(applicationsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Application status update failed:', error);
    throw error;
  }
}

export async function getApplicationsByRecipient(recipientId: number): Promise<Application[]> {
  try {
    const results = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.recipient_id, recipientId))
      .orderBy(desc(applicationsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch applications by recipient:', error);
    throw error;
  }
}

export async function getApplicationsByStatus(status: 'diterima' | 'diproses' | 'disetujui' | 'ditolak'): Promise<Application[]> {
  try {
    const results = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.status, status))
      .orderBy(desc(applicationsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch applications by status:', error);
    throw error;
  }
}

export async function getPendingApplicationsForSurvey(): Promise<Application[]> {
  try {
    // Get applications that are approved but don't have a completed survey
    const results = await db.select({
      id: applicationsTable.id,
      registration_number: applicationsTable.registration_number,
      recipient_id: applicationsTable.recipient_id,
      aid_program_id: applicationsTable.aid_program_id,
      status: applicationsTable.status,
      submission_date: applicationsTable.submission_date,
      notes: applicationsTable.notes,
      processed_by: applicationsTable.processed_by,
      processed_at: applicationsTable.processed_at,
      approved_by: applicationsTable.approved_by,
      approved_at: applicationsTable.approved_at,
      rejection_reason: applicationsTable.rejection_reason,
      created_at: applicationsTable.created_at,
      updated_at: applicationsTable.updated_at
    })
      .from(applicationsTable)
      .leftJoin(surveysTable, eq(applicationsTable.id, surveysTable.application_id))
      .where(
        and(
          eq(applicationsTable.status, 'disetujui'),
          eq(surveysTable.status, 'belum_survey')
        )
      )
      .orderBy(desc(applicationsTable.approved_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch pending applications for survey:', error);
    throw error;
  }
}