import { db } from '../db';
import { surveysTable, applicationsTable, usersTable } from '../db/schema';
import { type CreateSurveyInput, type UpdateSurveyInput, type Survey } from '../schema';
import { eq, and, or } from 'drizzle-orm';

export async function createSurvey(input: CreateSurveyInput, surveyorId: number): Promise<Survey> {
  try {
    // Verify the application exists
    const existingApplication = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.application_id))
      .execute();

    if (existingApplication.length === 0) {
      throw new Error('Application not found');
    }

    // Verify the surveyor exists and has the right role
    const existingSurveyor = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, surveyorId),
        eq(usersTable.role, 'petugas_lapangan'),
        eq(usersTable.is_active, true)
      ))
      .execute();

    if (existingSurveyor.length === 0) {
      throw new Error('Surveyor not found or not a field officer');
    }

    // Create the survey record
    const result = await db.insert(surveysTable)
      .values({
        application_id: input.application_id,
        surveyor_id: surveyorId,
        status: 'belum_survey',
        survey_date: input.survey_date || null,
        house_condition: input.house_condition || null,
        income_verification: input.income_verification || null,
        family_condition: input.family_condition || null,
        recommendations: input.recommendations || null,
        photo_urls: input.photo_urls ? JSON.stringify(input.photo_urls) : null,
        survey_notes: input.survey_notes || null
      })
      .returning()
      .execute();

    const survey = result[0];
    return {
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    };
  } catch (error) {
    console.error('Survey creation failed:', error);
    throw error;
  }
}

export async function getSurveysByApplication(applicationId: number): Promise<Survey[]> {
  try {
    const results = await db.select()
      .from(surveysTable)
      .where(eq(surveysTable.application_id, applicationId))
      .execute();

    return results.map(survey => ({
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    }));
  } catch (error) {
    console.error('Failed to get surveys by application:', error);
    throw error;
  }
}

export async function getSurveysBySurveyor(surveyorId: number): Promise<Survey[]> {
  try {
    const results = await db.select()
      .from(surveysTable)
      .where(eq(surveysTable.surveyor_id, surveyorId))
      .execute();

    return results.map(survey => ({
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    }));
  } catch (error) {
    console.error('Failed to get surveys by surveyor:', error);
    throw error;
  }
}

export async function getSurveyById(id: number): Promise<Survey | null> {
  try {
    const results = await db.select()
      .from(surveysTable)
      .where(eq(surveysTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const survey = results[0];
    return {
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    };
  } catch (error) {
    console.error('Failed to get survey by ID:', error);
    throw error;
  }
}

export async function updateSurvey(input: UpdateSurveyInput): Promise<Survey> {
  try {
    // Check if survey exists
    const existingSurvey = await db.select()
      .from(surveysTable)
      .where(eq(surveysTable.id, input.id))
      .execute();

    if (existingSurvey.length === 0) {
      throw new Error('Survey not found');
    }

    // Prepare update values
    const updateValues: any = {};
    
    if (input.status !== undefined) updateValues.status = input.status;
    if (input.survey_date !== undefined) updateValues.survey_date = input.survey_date;
    if (input.house_condition !== undefined) updateValues.house_condition = input.house_condition;
    if (input.income_verification !== undefined) updateValues.income_verification = input.income_verification;
    if (input.family_condition !== undefined) updateValues.family_condition = input.family_condition;
    if (input.recommendations !== undefined) updateValues.recommendations = input.recommendations;
    if (input.photo_urls !== undefined) {
      updateValues.photo_urls = input.photo_urls ? JSON.stringify(input.photo_urls) : null;
    }
    if (input.survey_notes !== undefined) updateValues.survey_notes = input.survey_notes;

    // Always update the updated_at timestamp
    updateValues.updated_at = new Date();

    const result = await db.update(surveysTable)
      .set(updateValues)
      .where(eq(surveysTable.id, input.id))
      .returning()
      .execute();

    const survey = result[0];
    return {
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    };
  } catch (error) {
    console.error('Survey update failed:', error);
    throw error;
  }
}

export async function getPendingSurveys(): Promise<Survey[]> {
  try {
    const results = await db.select()
      .from(surveysTable)
      .where(or(
        eq(surveysTable.status, 'belum_survey'),
        eq(surveysTable.status, 'sedang_survey')
      ))
      .execute();

    return results.map(survey => ({
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    }));
  } catch (error) {
    console.error('Failed to get pending surveys:', error);
    throw error;
  }
}

export async function getCompletedSurveys(): Promise<Survey[]> {
  try {
    const results = await db.select()
      .from(surveysTable)
      .where(eq(surveysTable.status, 'selesai_survey'))
      .execute();

    return results.map(survey => ({
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    }));
  } catch (error) {
    console.error('Failed to get completed surveys:', error);
    throw error;
  }
}

export async function assignSurveyor(applicationId: number, surveyorId: number): Promise<Survey> {
  try {
    // Verify the application exists
    const existingApplication = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId))
      .execute();

    if (existingApplication.length === 0) {
      throw new Error('Application not found');
    }

    // Verify the surveyor exists and has the right role
    const existingSurveyor = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, surveyorId),
        eq(usersTable.role, 'petugas_lapangan'),
        eq(usersTable.is_active, true)
      ))
      .execute();

    if (existingSurveyor.length === 0) {
      throw new Error('Surveyor not found or not a field officer');
    }

    // Check if a survey already exists for this application
    const existingSurvey = await db.select()
      .from(surveysTable)
      .where(eq(surveysTable.application_id, applicationId))
      .execute();

    if (existingSurvey.length > 0) {
      throw new Error('Survey already exists for this application');
    }

    // Create the survey record with assigned surveyor
    const result = await db.insert(surveysTable)
      .values({
        application_id: applicationId,
        surveyor_id: surveyorId,
        status: 'belum_survey'
      })
      .returning()
      .execute();

    const survey = result[0];
    return {
      ...survey,
      photo_urls: survey.photo_urls ? JSON.parse(survey.photo_urls) : null
    };
  } catch (error) {
    console.error('Surveyor assignment failed:', error);
    throw error;
  }
}