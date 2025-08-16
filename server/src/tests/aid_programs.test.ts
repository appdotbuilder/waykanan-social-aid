import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { aidProgramsTable, aidTypesTable } from '../db/schema';
import { type CreateAidProgramInput, type UpdateAidProgramInput } from '../schema';
import { 
  createAidProgram, 
  getAidPrograms, 
  getAidProgramById, 
  getActiveAidPrograms, 
  updateAidProgram, 
  deleteAidProgram 
} from '../handlers/aid_programs';
import { eq } from 'drizzle-orm';

// Test aid type for foreign key relationships
const testAidType = {
  name: 'Test Aid Type',
  description: 'Aid type for testing',
  requirements: 'Test requirements',
  is_active: true
};

// Helper to create future dates
const createFutureDate = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

// Test input data
const testProgramInput: CreateAidProgramInput = {
  name: 'Test Aid Program',
  description: 'A program for testing',
  aid_type_id: 1, // Will be set after creating aid type
  budget_allocated: 100000.50,
  start_date: createFutureDate(30),
  end_date: createFutureDate(365)
};

describe('Aid Programs Handler', () => {
  let testAidTypeId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test aid type first
    const aidTypeResult = await db.insert(aidTypesTable)
      .values(testAidType)
      .returning()
      .execute();
    
    testAidTypeId = aidTypeResult[0].id;
    testProgramInput.aid_type_id = testAidTypeId;
  });

  afterEach(resetDB);

  describe('createAidProgram', () => {
    it('should create an aid program with all fields', async () => {
      const result = await createAidProgram(testProgramInput);

      expect(result.name).toEqual('Test Aid Program');
      expect(result.description).toEqual('A program for testing');
      expect(result.aid_type_id).toEqual(testAidTypeId);
      expect(result.budget_allocated).toEqual(100000.50);
      expect(typeof result.budget_allocated).toBe('number');
      expect(result.start_date).toBeInstanceOf(Date);
      expect(result.end_date).toBeInstanceOf(Date);
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create an aid program with minimal fields', async () => {
      const minimalInput: CreateAidProgramInput = {
        name: 'Minimal Program',
        aid_type_id: testAidTypeId
      };

      const result = await createAidProgram(minimalInput);

      expect(result.name).toEqual('Minimal Program');
      expect(result.description).toBeNull();
      expect(result.budget_allocated).toBeNull();
      expect(result.start_date).toBeNull();
      expect(result.end_date).toBeNull();
      expect(result.is_active).toBe(true);
    });

    it('should save aid program to database', async () => {
      const result = await createAidProgram(testProgramInput);

      const programs = await db.select()
        .from(aidProgramsTable)
        .where(eq(aidProgramsTable.id, result.id))
        .execute();

      expect(programs).toHaveLength(1);
      expect(programs[0].name).toEqual('Test Aid Program');
      expect(parseFloat(programs[0].budget_allocated!)).toEqual(100000.50);
    });

    it('should throw error for non-existent aid type', async () => {
      const invalidInput: CreateAidProgramInput = {
        ...testProgramInput,
        aid_type_id: 9999
      };

      await expect(createAidProgram(invalidInput)).rejects.toThrow(/Aid type not found/i);
    });

    it('should throw error for inactive aid type', async () => {
      // Create inactive aid type
      const inactiveAidType = await db.insert(aidTypesTable)
        .values({ ...testAidType, is_active: false })
        .returning()
        .execute();

      const invalidInput: CreateAidProgramInput = {
        ...testProgramInput,
        aid_type_id: inactiveAidType[0].id
      };

      await expect(createAidProgram(invalidInput)).rejects.toThrow(/Aid type not found/i);
    });
  });

  describe('getAidPrograms', () => {
    it('should return empty array when no programs exist', async () => {
      const result = await getAidPrograms();
      expect(result).toEqual([]);
    });

    it('should return all aid programs', async () => {
      await createAidProgram(testProgramInput);
      await createAidProgram({
        ...testProgramInput,
        name: 'Second Program',
        budget_allocated: 50000.25
      });

      const result = await getAidPrograms();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Aid Program');
      expect(result[1].name).toEqual('Second Program');
      expect(typeof result[0].budget_allocated).toBe('number');
      expect(typeof result[1].budget_allocated).toBe('number');
      expect(result[1].budget_allocated).toEqual(50000.25);
    });

    it('should return both active and inactive programs', async () => {
      const program1 = await createAidProgram(testProgramInput);
      const program2 = await createAidProgram({
        ...testProgramInput,
        name: 'Inactive Program'
      });

      // Make second program inactive
      await db.update(aidProgramsTable)
        .set({ is_active: false })
        .where(eq(aidProgramsTable.id, program2.id))
        .execute();

      const result = await getAidPrograms();

      expect(result).toHaveLength(2);
      expect(result.find(p => p.id === program1.id)?.is_active).toBe(true);
      expect(result.find(p => p.id === program2.id)?.is_active).toBe(false);
    });
  });

  describe('getAidProgramById', () => {
    it('should return aid program by ID', async () => {
      const created = await createAidProgram(testProgramInput);

      const result = await getAidProgramById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test Aid Program');
      expect(typeof result!.budget_allocated).toBe('number');
      expect(result!.budget_allocated).toEqual(100000.50);
    });

    it('should return null for non-existent ID', async () => {
      const result = await getAidProgramById(9999);
      expect(result).toBeNull();
    });
  });

  describe('getActiveAidPrograms', () => {
    it('should return only active programs', async () => {
      const activeProgram = await createAidProgram(testProgramInput);
      const inactiveProgram = await createAidProgram({
        ...testProgramInput,
        name: 'Inactive Program'
      });

      // Make second program inactive
      await db.update(aidProgramsTable)
        .set({ is_active: false })
        .where(eq(aidProgramsTable.id, inactiveProgram.id))
        .execute();

      const result = await getActiveAidPrograms();

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(activeProgram.id);
      expect(result[0].is_active).toBe(true);
    });

    it('should return programs with no end date', async () => {
      const inputWithoutEndDate: CreateAidProgramInput = {
        name: testProgramInput.name,
        description: testProgramInput.description,
        aid_type_id: testProgramInput.aid_type_id,
        budget_allocated: testProgramInput.budget_allocated,
        start_date: testProgramInput.start_date
      };

      await createAidProgram(inputWithoutEndDate);

      const result = await getActiveAidPrograms();

      expect(result).toHaveLength(1);
      expect(result[0].end_date).toBeNull();
    });

    it('should return programs with future end dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await createAidProgram({
        ...testProgramInput,
        end_date: futureDate
      });

      const result = await getActiveAidPrograms();

      expect(result).toHaveLength(1);
      expect(result[0].end_date).toBeInstanceOf(Date);
    });

    it('should exclude programs with past end dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      await createAidProgram({
        ...testProgramInput,
        end_date: pastDate
      });

      const result = await getActiveAidPrograms();

      expect(result).toHaveLength(0);
    });

    it('should return permanent programs (no start/end dates)', async () => {
      const permanentInput: CreateAidProgramInput = {
        name: testProgramInput.name,
        description: testProgramInput.description,
        aid_type_id: testProgramInput.aid_type_id,
        budget_allocated: testProgramInput.budget_allocated
      };

      await createAidProgram(permanentInput);

      const result = await getActiveAidPrograms();

      expect(result).toHaveLength(1);
      expect(result[0].start_date).toBeNull();
      expect(result[0].end_date).toBeNull();
    });
  });

  describe('updateAidProgram', () => {
    it('should update aid program with all fields', async () => {
      const created = await createAidProgram(testProgramInput);

      // Create second aid type for testing aid_type_id update
      const secondAidType = await db.insert(aidTypesTable)
        .values({ ...testAidType, name: 'Second Aid Type' })
        .returning()
        .execute();

      const updateInput: UpdateAidProgramInput = {
        id: created.id,
        name: 'Updated Program',
        description: 'Updated description',
        aid_type_id: secondAidType[0].id,
        budget_allocated: 200000.75,
        start_date: createFutureDate(60),
        end_date: createFutureDate(180),
        is_active: false
      };

      const result = await updateAidProgram(updateInput);

      expect(result.name).toEqual('Updated Program');
      expect(result.description).toEqual('Updated description');
      expect(result.aid_type_id).toEqual(secondAidType[0].id);
      expect(result.budget_allocated).toEqual(200000.75);
      expect(typeof result.budget_allocated).toBe('number');
      expect(result.start_date).toBeInstanceOf(Date);
      expect(result.end_date).toBeInstanceOf(Date);
      expect(result.is_active).toBe(false);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should update only specified fields', async () => {
      const created = await createAidProgram(testProgramInput);

      const updateInput: UpdateAidProgramInput = {
        id: created.id,
        name: 'Partially Updated'
      };

      const result = await updateAidProgram(updateInput);

      expect(result.name).toEqual('Partially Updated');
      expect(result.description).toEqual(testProgramInput.description || null);
      expect(result.aid_type_id).toEqual(testAidTypeId);
      expect(result.budget_allocated).toEqual(testProgramInput.budget_allocated || null);
    });

    it('should save updated program to database', async () => {
      const created = await createAidProgram(testProgramInput);

      await updateAidProgram({
        id: created.id,
        name: 'Database Updated',
        budget_allocated: 75000.99
      });

      const programs = await db.select()
        .from(aidProgramsTable)
        .where(eq(aidProgramsTable.id, created.id))
        .execute();

      expect(programs[0].name).toEqual('Database Updated');
      expect(parseFloat(programs[0].budget_allocated!)).toEqual(75000.99);
    });

    it('should throw error for non-existent program', async () => {
      const updateInput: UpdateAidProgramInput = {
        id: 9999,
        name: 'Updated Program'
      };

      await expect(updateAidProgram(updateInput)).rejects.toThrow(/Aid program not found/i);
    });

    it('should throw error for non-existent aid type', async () => {
      const created = await createAidProgram(testProgramInput);

      const updateInput: UpdateAidProgramInput = {
        id: created.id,
        aid_type_id: 9999
      };

      await expect(updateAidProgram(updateInput)).rejects.toThrow(/Aid type not found/i);
    });
  });

  describe('deleteAidProgram', () => {
    it('should soft delete aid program', async () => {
      const created = await createAidProgram(testProgramInput);

      const result = await deleteAidProgram(created.id);

      expect(result).toBe(true);

      // Verify program is marked as inactive
      const programs = await db.select()
        .from(aidProgramsTable)
        .where(eq(aidProgramsTable.id, created.id))
        .execute();

      expect(programs[0].is_active).toBe(false);
      expect(programs[0].updated_at).toBeInstanceOf(Date);
    });

    it('should return false for non-existent program', async () => {
      const result = await deleteAidProgram(9999);
      expect(result).toBe(false);
    });

    it('should not appear in active programs after deletion', async () => {
      const created = await createAidProgram(testProgramInput);

      await deleteAidProgram(created.id);

      const activePrograms = await getActiveAidPrograms();
      expect(activePrograms.find(p => p.id === created.id)).toBeUndefined();
    });
  });
});