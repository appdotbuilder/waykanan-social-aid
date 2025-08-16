import { db } from '../db';
import { recipientsTable, usersTable } from '../db/schema';
import { type CreateRecipientInput, type GetRecipientsInput, type Recipient } from '../schema';
import { eq, and, or, like, SQL } from 'drizzle-orm';

export async function createRecipient(input: CreateRecipientInput, createdBy: number): Promise<Recipient> {
  try {
    // Check if NIK already exists
    const existingRecipient = await db.select()
      .from(recipientsTable)
      .where(eq(recipientsTable.nik, input.nik))
      .execute();

    if (existingRecipient.length > 0) {
      throw new Error('NIK already exists');
    }

    // Verify that the creator user exists
    const creator = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdBy))
      .execute();

    if (creator.length === 0) {
      throw new Error('Invalid creator user ID');
    }

    // Insert new recipient
    const result = await db.insert(recipientsTable)
      .values({
        nik: input.nik,
        full_name: input.full_name,
        birth_date: input.birth_date,
        birth_place: input.birth_place,
        gender: input.gender,
        address: input.address,
        phone: input.phone || null,
        village: input.village,
        district: input.district,
        regency: input.regency,
        province: input.province,
        postal_code: input.postal_code || null,
        marital_status: input.marital_status || null,
        occupation: input.occupation || null,
        monthly_income: input.monthly_income ? input.monthly_income.toString() : null,
        family_members_count: input.family_members_count || null,
        created_by: createdBy
      })
      .returning()
      .execute();

    const recipient = result[0];
    return {
      ...recipient,
      monthly_income: recipient.monthly_income ? parseFloat(recipient.monthly_income) : null
    };
  } catch (error) {
    console.error('Recipient creation failed:', error);
    throw error;
  }
}

export async function getRecipients(input?: GetRecipientsInput): Promise<Recipient[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    // Apply search filter (search by name or NIK)
    if (input?.search) {
      conditions.push(
        or(
          like(recipientsTable.full_name, `%${input.search}%`),
          like(recipientsTable.nik, `%${input.search}%`)
        )!
      );
    }

    // Apply village filter
    if (input?.village) {
      conditions.push(eq(recipientsTable.village, input.village));
    }

    // Apply district filter
    if (input?.district) {
      conditions.push(eq(recipientsTable.district, input.district));
    }

    // Build final query
    const limit = input?.limit || 50;
    const offset = input?.offset || 0;

    const results = conditions.length === 0
      ? await db.select()
          .from(recipientsTable)
          .limit(limit)
          .offset(offset)
          .execute()
      : await db.select()
          .from(recipientsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .limit(limit)
          .offset(offset)
          .execute();

    return results.map(recipient => ({
      ...recipient,
      monthly_income: recipient.monthly_income ? parseFloat(recipient.monthly_income) : null
    }));
  } catch (error) {
    console.error('Get recipients failed:', error);
    throw error;
  }
}

export async function getRecipientById(id: number): Promise<Recipient | null> {
  try {
    const results = await db.select()
      .from(recipientsTable)
      .where(eq(recipientsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const recipient = results[0];
    return {
      ...recipient,
      monthly_income: recipient.monthly_income ? parseFloat(recipient.monthly_income) : null
    };
  } catch (error) {
    console.error('Get recipient by ID failed:', error);
    throw error;
  }
}

export async function getRecipientByNik(nik: string): Promise<Recipient | null> {
  try {
    const results = await db.select()
      .from(recipientsTable)
      .where(eq(recipientsTable.nik, nik))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const recipient = results[0];
    return {
      ...recipient,
      monthly_income: recipient.monthly_income ? parseFloat(recipient.monthly_income) : null
    };
  } catch (error) {
    console.error('Get recipient by NIK failed:', error);
    throw error;
  }
}

export async function updateRecipient(id: number, input: Partial<CreateRecipientInput>): Promise<Recipient> {
  try {
    // Check if recipient exists
    const existingRecipient = await getRecipientById(id);
    if (!existingRecipient) {
      throw new Error('Recipient not found');
    }

    // If NIK is being updated, check for duplicates
    if (input.nik && input.nik !== existingRecipient.nik) {
      const nikExists = await getRecipientByNik(input.nik);
      if (nikExists) {
        throw new Error('NIK already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (input.nik !== undefined) updateData.nik = input.nik;
    if (input.full_name !== undefined) updateData.full_name = input.full_name;
    if (input.birth_date !== undefined) updateData.birth_date = input.birth_date;
    if (input.birth_place !== undefined) updateData.birth_place = input.birth_place;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.village !== undefined) updateData.village = input.village;
    if (input.district !== undefined) updateData.district = input.district;
    if (input.regency !== undefined) updateData.regency = input.regency;
    if (input.province !== undefined) updateData.province = input.province;
    if (input.postal_code !== undefined) updateData.postal_code = input.postal_code;
    if (input.marital_status !== undefined) updateData.marital_status = input.marital_status;
    if (input.occupation !== undefined) updateData.occupation = input.occupation;
    if (input.monthly_income !== undefined) updateData.monthly_income = input.monthly_income ? input.monthly_income.toString() : null;
    if (input.family_members_count !== undefined) updateData.family_members_count = input.family_members_count;

    updateData.updated_at = new Date();

    // Update recipient
    const result = await db.update(recipientsTable)
      .set(updateData)
      .where(eq(recipientsTable.id, id))
      .returning()
      .execute();

    const recipient = result[0];
    return {
      ...recipient,
      monthly_income: recipient.monthly_income ? parseFloat(recipient.monthly_income) : null
    };
  } catch (error) {
    console.error('Recipient update failed:', error);
    throw error;
  }
}

export async function getRecipientsByLocation(village?: string, district?: string): Promise<Recipient[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    if (village) {
      conditions.push(eq(recipientsTable.village, village));
    }

    if (district) {
      conditions.push(eq(recipientsTable.district, district));
    }

    const results = conditions.length === 0
      ? await db.select()
          .from(recipientsTable)
          .execute()
      : await db.select()
          .from(recipientsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute();

    return results.map(recipient => ({
      ...recipient,
      monthly_income: recipient.monthly_income ? parseFloat(recipient.monthly_income) : null
    }));
  } catch (error) {
    console.error('Get recipients by location failed:', error);
    throw error;
  }
}