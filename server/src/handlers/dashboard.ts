import { db } from '../db';
import { 
  applicationsTable, 
  recipientsTable, 
  aidProgramsTable, 
  surveysTable,
  usersTable 
} from '../db/schema';
import { type DashboardStats } from '../schema';
import { count, eq, and, gte, desc, sql } from 'drizzle-orm';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total applications
    const totalApplicationsResult = await db.select({ 
      count: count() 
    })
    .from(applicationsTable)
    .execute();

    const totalApplications = totalApplicationsResult[0]?.count || 0;

    // Get applications by status
    const applicationsByStatusResult = await db.select({
      status: applicationsTable.status,
      count: count()
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.status)
    .execute();

    const applicationsByStatus = {
      diterima: 0,
      diproses: 0,
      disetujui: 0,
      ditolak: 0
    };

    applicationsByStatusResult.forEach(result => {
      applicationsByStatus[result.status as keyof typeof applicationsByStatus] = result.count;
    });

    // Get total recipients
    const totalRecipientsResult = await db.select({
      count: count()
    })
    .from(recipientsTable)
    .execute();

    const totalRecipients = totalRecipientsResult[0]?.count || 0;

    // Get active programs count
    const activeProgramsResult = await db.select({
      count: count()
    })
    .from(aidProgramsTable)
    .where(eq(aidProgramsTable.is_active, true))
    .execute();

    const activePrograms = activeProgramsResult[0]?.count || 0;

    // Get pending surveys count
    const pendingSurveysResult = await db.select({
      count: count()
    })
    .from(surveysTable)
    .where(eq(surveysTable.status, 'belum_survey'))
    .execute();

    const pendingSurveys = pendingSurveysResult[0]?.count || 0;

    return {
      total_applications: totalApplications,
      applications_by_status: applicationsByStatus,
      total_recipients: totalRecipients,
      active_programs: activePrograms,
      pending_surveys: pendingSurveys
    };
  } catch (error) {
    console.error('Dashboard stats fetch failed:', error);
    throw error;
  }
}

export async function getApplicationTrends(days: number = 30): Promise<Array<{ date: string; count: number }>> {
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const trendsResult = await db.select({
      date: sql<string>`DATE(${applicationsTable.submission_date})`,
      count: count()
    })
    .from(applicationsTable)
    .where(gte(applicationsTable.submission_date, daysAgo))
    .groupBy(sql`DATE(${applicationsTable.submission_date})`)
    .orderBy(sql`DATE(${applicationsTable.submission_date})`)
    .execute();

    return trendsResult.map(result => ({
      date: result.date,
      count: result.count
    }));
  } catch (error) {
    console.error('Application trends fetch failed:', error);
    throw error;
  }
}

export async function getLocationStats(): Promise<Array<{ village: string; district: string; count: number }>> {
  try {
    const locationStatsResult = await db.select({
      village: recipientsTable.village,
      district: recipientsTable.district,
      count: count()
    })
    .from(recipientsTable)
    .groupBy(recipientsTable.village, recipientsTable.district)
    .orderBy(desc(count()), recipientsTable.district, recipientsTable.village)
    .execute();

    return locationStatsResult.map(result => ({
      village: result.village,
      district: result.district,
      count: result.count
    }));
  } catch (error) {
    console.error('Location stats fetch failed:', error);
    throw error;
  }
}

export async function getProgramStats(): Promise<Array<{ program_name: string; application_count: number; approved_count: number }>> {
  try {
    // Get all application counts per program
    const programApplicationsResult = await db.select({
      program_id: aidProgramsTable.id,
      program_name: aidProgramsTable.name,
      application_count: count(applicationsTable.id),
      approved_count: sql<number>`COUNT(CASE WHEN ${applicationsTable.status} = 'disetujui' THEN 1 END)`
    })
    .from(aidProgramsTable)
    .leftJoin(applicationsTable, eq(aidProgramsTable.id, applicationsTable.aid_program_id))
    .groupBy(aidProgramsTable.id, aidProgramsTable.name)
    .orderBy(desc(count(applicationsTable.id)))
    .execute();

    return programApplicationsResult.map(result => ({
      program_name: result.program_name,
      application_count: result.application_count,
      approved_count: Number(result.approved_count)
    }));
  } catch (error) {
    console.error('Program stats fetch failed:', error);
    throw error;
  }
}

export async function getStaffWorkload(): Promise<Array<{ staff_name: string; role: string; pending_tasks: number }>> {
  try {
    // Get pending tasks per staff member
    // Tasks include: unprocessed applications and pending surveys
    const staffWorkloadResult = await db.select({
      staff_id: usersTable.id,
      staff_name: usersTable.full_name,
      role: usersTable.role,
      pending_applications: sql<number>`COUNT(CASE WHEN ${applicationsTable.status} = 'diterima' AND ${applicationsTable.processed_by} IS NULL THEN 1 END)`,
      pending_surveys: sql<number>`COUNT(CASE WHEN ${surveysTable.status} = 'belum_survey' THEN 1 END)`
    })
    .from(usersTable)
    .leftJoin(applicationsTable, eq(usersTable.id, applicationsTable.processed_by))
    .leftJoin(surveysTable, eq(usersTable.id, surveysTable.surveyor_id))
    .where(
      and(
        eq(usersTable.is_active, true),
        sql`${usersTable.role} IN ('operator_staf', 'petugas_lapangan')`
      )
    )
    .groupBy(usersTable.id, usersTable.full_name, usersTable.role)
    .orderBy(desc(sql`COUNT(CASE WHEN ${applicationsTable.status} = 'diterima' AND ${applicationsTable.processed_by} IS NULL THEN 1 END) + COUNT(CASE WHEN ${surveysTable.status} = 'belum_survey' THEN 1 END)`))
    .execute();

    return staffWorkloadResult.map(result => ({
      staff_name: result.staff_name,
      role: result.role,
      pending_tasks: Number(result.pending_applications) + Number(result.pending_surveys)
    }));
  } catch (error) {
    console.error('Staff workload fetch failed:', error);
    throw error;
  }
}