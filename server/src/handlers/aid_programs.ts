import { db } from '../db';
import { aidProgramsTable, aidTypesTable } from '../db/schema';
import { type CreateAidProgramInput, type UpdateAidProgramInput, type AidProgram } from '../schema';
import { eq, and, or, isNull, lte, gte } from 'drizzle-orm';

export async function createAidProgram(input: CreateAidProgramInput): Promise<AidProgram> {
  try {
    // Verify aid type exists before creating program
    const aidType = await db.select()
      .from(aidTypesTable)
      .where(and(eq(aidTypesTable.id, input.aid_type_id), eq(aidTypesTable.is_active, true)))
      .execute();

    if (aidType.length === 0) {
      throw new Error('Aid type not found or inactive');
    }

    const result = await db.insert(aidProgramsTable)
      .values({
        name: input.name,
        description: input.description || null,
        aid_type_id: input.aid_type_id,
        budget_allocated: input.budget_allocated ? input.budget_allocated.toString() : null,
        start_date: input.start_date || null,
        end_date: input.end_date || null
      })
      .returning()
      .execute();

    const program = result[0];
    return {
      ...program,
      budget_allocated: program.budget_allocated ? parseFloat(program.budget_allocated) : null
    };
  } catch (error) {
    console.error('Aid program creation failed:', error);
    throw error;
  }
}

export async function getAidPrograms(): Promise<AidProgram[]> {
  try {
    const results = await db.select()
      .from(aidProgramsTable)
      .execute();

    return results.map(program => ({
      ...program,
      budget_allocated: program.budget_allocated ? parseFloat(program.budget_allocated) : null
    }));
  } catch (error) {
    console.error('Failed to fetch aid programs:', error);
    throw error;
  }
}

export async function getAidProgramById(id: number): Promise<AidProgram | null> {
  try {
    const results = await db.select()
      .from(aidProgramsTable)
      .where(eq(aidProgramsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const program = results[0];
    return {
      ...program,
      budget_allocated: program.budget_allocated ? parseFloat(program.budget_allocated) : null
    };
  } catch (error) {
    console.error('Failed to fetch aid program by ID:', error);
    throw error;
  }
}

export async function getActiveAidPrograms(): Promise<AidProgram[]> {
  try {
    const today = new Date();

    // Filter programs that are either:
    // 1. Have no end date, or
    // 2. End date is in the future
    const conditions = [
      isNull(aidProgramsTable.end_date),
      gte(aidProgramsTable.end_date, today)
    ];

    const query = db.select()
      .from(aidProgramsTable)
      .where(and(
        eq(aidProgramsTable.is_active, true),
        or(...conditions)
      ));

    const results = await query.execute();

    return results.map(program => ({
      ...program,
      budget_allocated: program.budget_allocated ? parseFloat(program.budget_allocated) : null
    }));
  } catch (error) {
    console.error('Failed to fetch active aid programs:', error);
    throw error;
  }
}

export async function updateAidProgram(input: UpdateAidProgramInput): Promise<AidProgram> {
  try {
    // Check if program exists
    const existing = await db.select()
      .from(aidProgramsTable)
      .where(eq(aidProgramsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error('Aid program not found');
    }

    // If aid_type_id is being updated, verify the new aid type exists
    if (input.aid_type_id) {
      const aidType = await db.select()
        .from(aidTypesTable)
        .where(and(eq(aidTypesTable.id, input.aid_type_id), eq(aidTypesTable.is_active, true)))
        .execute();

      if (aidType.length === 0) {
        throw new Error('Aid type not found or inactive');
      }
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.aid_type_id !== undefined) updateData.aid_type_id = input.aid_type_id;
    if (input.budget_allocated !== undefined) {
      updateData.budget_allocated = input.budget_allocated ? input.budget_allocated.toString() : null;
    }
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const result = await db.update(aidProgramsTable)
      .set(updateData)
      .where(eq(aidProgramsTable.id, input.id))
      .returning()
      .execute();

    const program = result[0];
    return {
      ...program,
      budget_allocated: program.budget_allocated ? parseFloat(program.budget_allocated) : null
    };
  } catch (error) {
    console.error('Aid program update failed:', error);
    throw error;
  }
}

export async function deleteAidProgram(id: number): Promise<boolean> {
  try {
    const result = await db.update(aidProgramsTable)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(aidProgramsTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Aid program deletion failed:', error);
    throw error;
  }
}