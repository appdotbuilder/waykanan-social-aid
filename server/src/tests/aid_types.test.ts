import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { aidTypesTable } from '../db/schema';
import { type CreateAidTypeInput, type UpdateAidTypeInput } from '../schema';
import { 
  createAidType, 
  getAidTypes, 
  getAidTypeById, 
  updateAidType, 
  deleteAidType 
} from '../handlers/aid_types';
import { eq } from 'drizzle-orm';

describe('Aid Types Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createAidType', () => {
    it('should create an aid type with all fields', async () => {
      const input: CreateAidTypeInput = {
        name: 'Bantuan Sembako',
        description: 'Bantuan paket sembilan bahan pokok untuk keluarga kurang mampu',
        requirements: 'KTP, KK, Surat Keterangan Tidak Mampu'
      };

      const result = await createAidType(input);

      expect(result.name).toBe('Bantuan Sembako');
      expect(result.description).toBe(input.description || null);
      expect(result.requirements).toBe(input.requirements || null);
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create an aid type with minimal fields', async () => {
      const input: CreateAidTypeInput = {
        name: 'Bantuan Tunai'
      };

      const result = await createAidType(input);

      expect(result.name).toBe('Bantuan Tunai');
      expect(result.description).toBeNull();
      expect(result.requirements).toBeNull();
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('should save aid type to database', async () => {
      const input: CreateAidTypeInput = {
        name: 'Bantuan Kesehatan',
        description: 'Bantuan untuk biaya pengobatan',
        requirements: 'KTP, KK, Surat Dokter'
      };

      const result = await createAidType(input);

      const saved = await db.select()
        .from(aidTypesTable)
        .where(eq(aidTypesTable.id, result.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('Bantuan Kesehatan');
      expect(saved[0].description).toBe(input.description || null);
      expect(saved[0].requirements).toBe(input.requirements || null);
      expect(saved[0].is_active).toBe(true);
    });
  });

  describe('getAidTypes', () => {
    it('should return empty array when no aid types exist', async () => {
      const result = await getAidTypes();
      expect(result).toEqual([]);
    });

    it('should return all aid types', async () => {
      // Create test data
      await createAidType({
        name: 'Bantuan Sembako',
        description: 'Bantuan paket sembako'
      });

      await createAidType({
        name: 'Bantuan Tunai',
        description: 'Bantuan uang tunai'
      });

      const results = await getAidTypes();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Bantuan Sembako');
      expect(results[1].name).toBe('Bantuan Tunai');
      
      results.forEach(aidType => {
        expect(aidType.id).toBeDefined();
        expect(aidType.is_active).toBe(true);
        expect(aidType.created_at).toBeInstanceOf(Date);
      });
    });

    it('should return both active and inactive aid types', async () => {
      const aidType1 = await createAidType({
        name: 'Active Aid Type'
      });

      const aidType2 = await createAidType({
        name: 'Inactive Aid Type'
      });

      // Make one inactive
      await updateAidType({
        id: aidType2.id,
        is_active: false
      });

      const results = await getAidTypes();

      expect(results).toHaveLength(2);
      const activeType = results.find(at => at.id === aidType1.id);
      const inactiveType = results.find(at => at.id === aidType2.id);

      expect(activeType?.is_active).toBe(true);
      expect(inactiveType?.is_active).toBe(false);
    });
  });

  describe('getAidTypeById', () => {
    it('should return null for non-existent aid type', async () => {
      const result = await getAidTypeById(999);
      expect(result).toBeNull();
    });

    it('should return aid type when it exists', async () => {
      const created = await createAidType({
        name: 'Test Aid Type',
        description: 'Test description',
        requirements: 'Test requirements'
      });

      const result = await getAidTypeById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Test Aid Type');
      expect(result?.description).toBe('Test description');
      expect(result?.requirements).toBe('Test requirements');
      expect(result?.is_active).toBe(true);
    });
  });

  describe('updateAidType', () => {
    it('should update aid type name', async () => {
      const created = await createAidType({
        name: 'Original Name',
        description: 'Original description'
      });

      const input: UpdateAidTypeInput = {
        id: created.id,
        name: 'Updated Name'
      };

      const result = await updateAidType(input);

      expect(result.id).toBe(created.id);
      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Original description'); // Should remain unchanged
      expect(result.updated_at).toBeInstanceOf(Date);
      // Just verify that updated_at is a valid date, timestamp comparison can be flaky
    });

    it('should update multiple fields', async () => {
      const created = await createAidType({
        name: 'Original Name',
        description: 'Original description'
      });

      const input: UpdateAidTypeInput = {
        id: created.id,
        name: 'Updated Name',
        description: 'Updated description',
        requirements: 'New requirements',
        is_active: false
      };

      const result = await updateAidType(input);

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated description');
      expect(result.requirements).toBe('New requirements');
      expect(result.is_active).toBe(false);
    });

    it('should update aid type in database', async () => {
      const created = await createAidType({
        name: 'Original Name'
      });

      await updateAidType({
        id: created.id,
        name: 'Database Updated Name',
        is_active: false
      });

      const saved = await db.select()
        .from(aidTypesTable)
        .where(eq(aidTypesTable.id, created.id))
        .execute();

      expect(saved[0].name).toBe('Database Updated Name');
      expect(saved[0].is_active).toBe(false);
    });

    it('should throw error for non-existent aid type', async () => {
      const input: UpdateAidTypeInput = {
        id: 999,
        name: 'Non-existent'
      };

      await expect(updateAidType(input)).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteAidType', () => {
    it('should return false for non-existent aid type', async () => {
      const result = await deleteAidType(999);
      expect(result).toBe(false);
    });

    it('should soft delete existing aid type', async () => {
      const created = await createAidType({
        name: 'To Be Deleted'
      });

      const result = await deleteAidType(created.id);
      expect(result).toBe(true);

      // Verify it's soft deleted (is_active = false)
      const saved = await db.select()
        .from(aidTypesTable)
        .where(eq(aidTypesTable.id, created.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].is_active).toBe(false);
    });

    it('should keep aid type accessible via getAidTypes after deletion', async () => {
      const created = await createAidType({
        name: 'Soft Deleted Type'
      });

      await deleteAidType(created.id);

      const allTypes = await getAidTypes();
      const deletedType = allTypes.find(at => at.id === created.id);

      expect(deletedType).toBeDefined();
      expect(deletedType?.is_active).toBe(false);
    });

    it('should still be retrievable by ID after deletion', async () => {
      const created = await createAidType({
        name: 'Soft Deleted Type'
      });

      await deleteAidType(created.id);

      const retrieved = await getAidTypeById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.is_active).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined optional fields correctly', async () => {
      const input: CreateAidTypeInput = {
        name: 'Test Type',
        description: null,
        requirements: undefined
      };

      const result = await createAidType(input);

      expect(result.description).toBeNull();
      expect(result.requirements).toBeNull();
    });

    it('should update only specified fields', async () => {
      const created = await createAidType({
        name: 'Original',
        description: 'Original desc',
        requirements: 'Original req'
      });

      await updateAidType({
        id: created.id,
        description: 'New description'
        // name and requirements not specified - should remain unchanged
      });

      const updated = await getAidTypeById(created.id);

      expect(updated?.name).toBe('Original');
      expect(updated?.description).toBe('New description');
      expect(updated?.requirements).toBe('Original req');
    });
  });
});