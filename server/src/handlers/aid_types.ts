import { db } from '../db';
import { aidTypesTable } from '../db/schema';
import { type CreateAidTypeInput, type UpdateAidTypeInput, type AidType } from '../schema';
import { eq } from 'drizzle-orm';

export async function createAidType(input: CreateAidTypeInput): Promise<AidType> {
  try {
    const result = await db.insert(aidTypesTable)
      .values({
        name: input.name,
        description: input.description || null,
        requirements: input.requirements || null
      })
      .returning()
      .execute();

    const aidType = result[0];
    return aidType as AidType;
  } catch (error) {
    console.error('Aid type creation failed:', error);
    throw error;
  }
}

export async function getAidTypes(): Promise<AidType[]> {
  try {
    const results = await db.select()
      .from(aidTypesTable)
      .execute();

    return results as AidType[];
  } catch (error) {
    console.error('Failed to fetch aid types:', error);
    throw error;
  }
}

export async function getAidTypeById(id: number): Promise<AidType | null> {
  try {
    const results = await db.select()
      .from(aidTypesTable)
      .where(eq(aidTypesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const aidType = results[0];
    return aidType as AidType;
  } catch (error) {
    console.error('Failed to fetch aid type by ID:', error);
    throw error;
  }
}

export async function updateAidType(input: UpdateAidTypeInput): Promise<AidType> {
  try {
    // Check if aid type exists
    const existing = await getAidTypeById(input.id);
    if (!existing) {
      throw new Error(`Aid type with ID ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof aidTypesTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.requirements !== undefined) {
      updateData.requirements = input.requirements;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Ensure updated_at is always updated
    updateData.updated_at = new Date();
    
    const result = await db.update(aidTypesTable)
      .set(updateData)
      .where(eq(aidTypesTable.id, input.id))
      .returning()
      .execute();

    const aidType = result[0];
    return aidType as AidType;
  } catch (error) {
    console.error('Aid type update failed:', error);
    throw error;
  }
}

export async function deleteAidType(id: number): Promise<boolean> {
  try {
    // Check if aid type exists
    const existing = await getAidTypeById(id);
    if (!existing) {
      return false;
    }

    // Soft delete by setting is_active to false
    await db.update(aidTypesTable)
      .set({ is_active: false })
      .where(eq(aidTypesTable.id, id))
      .execute();

    return true;
  } catch (error) {
    console.error('Aid type deletion failed:', error);
    throw error;
  }
}