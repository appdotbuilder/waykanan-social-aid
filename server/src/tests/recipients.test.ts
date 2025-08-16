import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { recipientsTable, usersTable } from '../db/schema';
import { type CreateRecipientInput, type GetRecipientsInput } from '../schema';
import { 
  createRecipient, 
  getRecipients, 
  getRecipientById, 
  getRecipientByNik, 
  updateRecipient, 
  getRecipientsByLocation 
} from '../handlers/recipients';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'test_admin',
  email: 'admin@test.com',
  password_hash: 'hashed_password',
  full_name: 'Test Admin',
  role: 'admin_dinas' as const
};

// Test recipient input
const testRecipientInput: CreateRecipientInput = {
  nik: '1234567890123456',
  full_name: 'John Doe',
  birth_date: new Date('1990-01-01'),
  birth_place: 'Jakarta',
  gender: 'laki_laki',
  address: 'Jl. Test No. 123',
  phone: '081234567890',
  village: 'Desa Test',
  district: 'Kecamatan Test',
  regency: 'Way Kanan',
  province: 'Lampung',
  postal_code: '12345',
  marital_status: 'menikah',
  occupation: 'petani',
  monthly_income: 2500000,
  family_members_count: 4
};

describe('Recipients Handlers', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  describe('createRecipient', () => {
    it('should create a recipient successfully', async () => {
      const result = await createRecipient(testRecipientInput, userId);

      expect(result.id).toBeDefined();
      expect(result.nik).toEqual('1234567890123456');
      expect(result.full_name).toEqual('John Doe');
      expect(result.birth_date).toBeInstanceOf(Date);
      expect(result.birth_place).toEqual('Jakarta');
      expect(result.gender).toEqual('laki_laki');
      expect(result.address).toEqual('Jl. Test No. 123');
      expect(result.phone).toEqual('081234567890');
      expect(result.village).toEqual('Desa Test');
      expect(result.district).toEqual('Kecamatan Test');
      expect(result.regency).toEqual('Way Kanan');
      expect(result.province).toEqual('Lampung');
      expect(result.postal_code).toEqual('12345');
      expect(result.marital_status).toEqual('menikah');
      expect(result.occupation).toEqual('petani');
      expect(typeof result.monthly_income).toEqual('number');
      expect(result.monthly_income).toEqual(2500000);
      expect(result.family_members_count).toEqual(4);
      expect(result.created_by).toEqual(userId);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save recipient to database', async () => {
      const result = await createRecipient(testRecipientInput, userId);

      const recipients = await db.select()
        .from(recipientsTable)
        .where(eq(recipientsTable.id, result.id))
        .execute();

      expect(recipients).toHaveLength(1);
      expect(recipients[0].nik).toEqual('1234567890123456');
      expect(recipients[0].full_name).toEqual('John Doe');
      expect(parseFloat(recipients[0].monthly_income!)).toEqual(2500000);
      expect(recipients[0].created_by).toEqual(userId);
    });

    it('should throw error for duplicate NIK', async () => {
      await createRecipient(testRecipientInput, userId);

      await expect(createRecipient(testRecipientInput, userId))
        .rejects.toThrow(/NIK already exists/i);
    });

    it('should throw error for invalid creator user ID', async () => {
      await expect(createRecipient(testRecipientInput, 99999))
        .rejects.toThrow(/Invalid creator user ID/i);
    });

    it('should handle null optional fields', async () => {
      const minimalInput: CreateRecipientInput = {
        nik: '9876543210987654',
        full_name: 'Jane Doe',
        birth_date: new Date('1985-05-15'),
        birth_place: 'Bandung',
        gender: 'perempuan',
        address: 'Jl. Minimal No. 1',
        village: 'Desa Minimal',
        district: 'Kecamatan Minimal',
        regency: 'Kabupaten Test',
        province: 'Jawa Barat'
      };

      const result = await createRecipient(minimalInput, userId);

      expect(result.phone).toBeNull();
      expect(result.postal_code).toBeNull();
      expect(result.marital_status).toBeNull();
      expect(result.occupation).toBeNull();
      expect(result.monthly_income).toBeNull();
      expect(result.family_members_count).toBeNull();
    });
  });

  describe('getRecipients', () => {
    beforeEach(async () => {
      // Create multiple test recipients
      const recipients = [
        { ...testRecipientInput, nik: '1111111111111111', full_name: 'Alice Johnson', village: 'Village A', district: 'District A' },
        { ...testRecipientInput, nik: '2222222222222222', full_name: 'Bob Smith', village: 'Village B', district: 'District A' },
        { ...testRecipientInput, nik: '3333333333333333', full_name: 'Charlie Brown', village: 'Village A', district: 'District B' }
      ];

      for (const recipient of recipients) {
        await createRecipient(recipient, userId);
      }
    });

    it('should get all recipients without filters', async () => {
      const result = await getRecipients();

      expect(result).toHaveLength(3);
      expect(result.every(r => typeof r.monthly_income === 'number')).toBe(true);
    });

    it('should filter by search term (name)', async () => {
      const input: GetRecipientsInput = {
        search: 'Alice'
      };

      const result = await getRecipients(input);

      expect(result).toHaveLength(1);
      expect(result[0].full_name).toEqual('Alice Johnson');
    });

    it('should filter by search term (NIK)', async () => {
      const input: GetRecipientsInput = {
        search: '2222222222222222'
      };

      const result = await getRecipients(input);

      expect(result).toHaveLength(1);
      expect(result[0].full_name).toEqual('Bob Smith');
    });

    it('should filter by village', async () => {
      const input: GetRecipientsInput = {
        village: 'Village A'
      };

      const result = await getRecipients(input);

      expect(result).toHaveLength(2);
      expect(result.every(r => r.village === 'Village A')).toBe(true);
    });

    it('should filter by district', async () => {
      const input: GetRecipientsInput = {
        district: 'District A'
      };

      const result = await getRecipients(input);

      expect(result).toHaveLength(2);
      expect(result.every(r => r.district === 'District A')).toBe(true);
    });

    it('should apply pagination', async () => {
      const input: GetRecipientsInput = {
        limit: 2,
        offset: 1
      };

      const result = await getRecipients(input);

      expect(result).toHaveLength(2);
    });

    it('should combine filters', async () => {
      const input: GetRecipientsInput = {
        village: 'Village A',
        district: 'District A'
      };

      const result = await getRecipients(input);

      expect(result).toHaveLength(1);
      expect(result[0].full_name).toEqual('Alice Johnson');
    });
  });

  describe('getRecipientById', () => {
    it('should get recipient by ID', async () => {
      const created = await createRecipient(testRecipientInput, userId);
      const result = await getRecipientById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.nik).toEqual('1234567890123456');
      expect(typeof result!.monthly_income).toEqual('number');
    });

    it('should return null for non-existent ID', async () => {
      const result = await getRecipientById(99999);

      expect(result).toBeNull();
    });
  });

  describe('getRecipientByNik', () => {
    it('should get recipient by NIK', async () => {
      await createRecipient(testRecipientInput, userId);
      const result = await getRecipientByNik('1234567890123456');

      expect(result).not.toBeNull();
      expect(result!.nik).toEqual('1234567890123456');
      expect(result!.full_name).toEqual('John Doe');
      expect(typeof result!.monthly_income).toEqual('number');
    });

    it('should return null for non-existent NIK', async () => {
      const result = await getRecipientByNik('9999999999999999');

      expect(result).toBeNull();
    });
  });

  describe('updateRecipient', () => {
    it('should update recipient successfully', async () => {
      const created = await createRecipient(testRecipientInput, userId);
      
      const updateInput = {
        full_name: 'John Updated',
        monthly_income: 3000000,
        occupation: 'guru'
      };

      const result = await updateRecipient(created.id, updateInput);

      expect(result.full_name).toEqual('John Updated');
      expect(result.monthly_income).toEqual(3000000);
      expect(result.occupation).toEqual('guru');
      expect(result.nik).toEqual(testRecipientInput.nik); // Should remain unchanged
    });

    it('should throw error for non-existent recipient', async () => {
      const updateInput = {
        full_name: 'Non Existent'
      };

      await expect(updateRecipient(99999, updateInput))
        .rejects.toThrow(/Recipient not found/i);
    });

    it('should throw error when updating to duplicate NIK', async () => {
      const recipient1 = await createRecipient(testRecipientInput, userId);
      const recipient2Input = { ...testRecipientInput, nik: '9876543210987654' };
      const recipient2 = await createRecipient(recipient2Input, userId);

      await expect(updateRecipient(recipient2.id, { nik: recipient1.nik }))
        .rejects.toThrow(/NIK already exists/i);
    });

    it('should allow updating same recipient with same NIK', async () => {
      const created = await createRecipient(testRecipientInput, userId);
      
      const updateInput = {
        nik: created.nik,
        full_name: 'Same NIK Update'
      };

      const result = await updateRecipient(created.id, updateInput);

      expect(result.full_name).toEqual('Same NIK Update');
      expect(result.nik).toEqual(created.nik);
    });
  });

  describe('getRecipientsByLocation', () => {
    beforeEach(async () => {
      const recipients = [
        { ...testRecipientInput, nik: '1111111111111111', village: 'Village A', district: 'District A' },
        { ...testRecipientInput, nik: '2222222222222222', village: 'Village B', district: 'District A' },
        { ...testRecipientInput, nik: '3333333333333333', village: 'Village A', district: 'District B' }
      ];

      for (const recipient of recipients) {
        await createRecipient(recipient, userId);
      }
    });

    it('should get recipients by village only', async () => {
      const result = await getRecipientsByLocation('Village A');

      expect(result).toHaveLength(2);
      expect(result.every(r => r.village === 'Village A')).toBe(true);
    });

    it('should get recipients by district only', async () => {
      const result = await getRecipientsByLocation(undefined, 'District A');

      expect(result).toHaveLength(2);
      expect(result.every(r => r.district === 'District A')).toBe(true);
    });

    it('should get recipients by both village and district', async () => {
      const result = await getRecipientsByLocation('Village A', 'District A');

      expect(result).toHaveLength(1);
      expect(result[0].village).toEqual('Village A');
      expect(result[0].district).toEqual('District A');
    });

    it('should return all recipients when no location specified', async () => {
      const result = await getRecipientsByLocation();

      expect(result).toHaveLength(3);
    });

    it('should return empty array for non-matching location', async () => {
      const result = await getRecipientsByLocation('Non Existent Village');

      expect(result).toHaveLength(0);
    });
  });
});