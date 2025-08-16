import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, recipientsTable, documentsTable } from '../db/schema';
import { type UploadDocumentInput, type VerifyDocumentInput } from '../schema';
import { 
  uploadDocument, 
  getDocumentsByRecipient, 
  getDocumentById, 
  verifyDocument, 
  getPendingDocuments, 
  getDocumentsByType, 
  deleteDocument 
} from '../handlers/documents';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  full_name: 'Test User',
  role: 'admin_dinas' as const,
  phone: '081234567890'
};

const testRecipient = {
  nik: '1234567890123456',
  full_name: 'John Doe',
  birth_date: new Date('1990-01-01'),
  birth_place: 'Jakarta',
  gender: 'laki_laki' as const,
  address: 'Jl. Test No. 123',
  phone: '081234567890',
  village: 'Test Village',
  district: 'Test District',
  regency: 'Test Regency',
  province: 'Test Province',
  postal_code: '12345',
  marital_status: 'single',
  occupation: 'unemployed',
  monthly_income: '2000000.00', // Convert to string for numeric column
  family_members_count: 4
};

const testDocumentInput: UploadDocumentInput = {
  recipient_id: 1,
  document_type: 'ktp',
  file_name: 'ktp.pdf',
  file_path: '/uploads/ktp.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf'
};

describe('Document Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let recipientId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create prerequisite recipient
    const recipientResult = await db.insert(recipientsTable)
      .values({
        ...testRecipient,
        created_by: userId
      })
      .returning()
      .execute();
    recipientId = recipientResult[0].id;

    // Update test document input with actual recipient ID
    testDocumentInput.recipient_id = recipientId;
  });

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const result = await uploadDocument(testDocumentInput);

      expect(result.id).toBeDefined();
      expect(result.recipient_id).toEqual(recipientId);
      expect(result.document_type).toEqual('ktp');
      expect(result.file_name).toEqual('ktp.pdf');
      expect(result.file_path).toEqual('/uploads/ktp.pdf');
      expect(result.file_size).toEqual(1024000);
      expect(result.mime_type).toEqual('application/pdf');
      expect(result.is_verified).toEqual(false);
      expect(result.verified_by).toBeNull();
      expect(result.verified_at).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.uploaded_at).toBeInstanceOf(Date);
    });

    it('should save document to database', async () => {
      const result = await uploadDocument(testDocumentInput);

      const documents = await db.select()
        .from(documentsTable)
        .where(eq(documentsTable.id, result.id))
        .execute();

      expect(documents).toHaveLength(1);
      expect(documents[0].file_name).toEqual('ktp.pdf');
      expect(documents[0].recipient_id).toEqual(recipientId);
      expect(documents[0].is_verified).toEqual(false);
    });

    it('should throw error for non-existent recipient', async () => {
      const invalidInput = {
        ...testDocumentInput,
        recipient_id: 99999
      };

      await expect(uploadDocument(invalidInput)).rejects.toThrow(/recipient not found/i);
    });
  });

  describe('getDocumentsByRecipient', () => {
    it('should get documents for a recipient', async () => {
      // Upload multiple documents
      await uploadDocument(testDocumentInput);
      await uploadDocument({
        ...testDocumentInput,
        document_type: 'kk',
        file_name: 'kk.pdf',
        file_path: '/uploads/kk.pdf'
      });

      const documents = await getDocumentsByRecipient(recipientId);

      expect(documents).toHaveLength(2);
      expect(documents[0].recipient_id).toEqual(recipientId);
      expect(documents[1].recipient_id).toEqual(recipientId);
    });

    it('should return empty array for recipient with no documents', async () => {
      const documents = await getDocumentsByRecipient(recipientId);

      expect(documents).toHaveLength(0);
    });
  });

  describe('getDocumentById', () => {
    it('should get document by ID', async () => {
      const uploaded = await uploadDocument(testDocumentInput);
      const document = await getDocumentById(uploaded.id);

      expect(document).toBeDefined();
      expect(document!.id).toEqual(uploaded.id);
      expect(document!.file_name).toEqual('ktp.pdf');
    });

    it('should return null for non-existent document', async () => {
      const document = await getDocumentById(99999);

      expect(document).toBeNull();
    });
  });

  describe('verifyDocument', () => {
    it('should verify document successfully', async () => {
      const uploaded = await uploadDocument(testDocumentInput);

      const verifyInput: VerifyDocumentInput = {
        id: uploaded.id,
        is_verified: true,
        notes: 'Document looks good'
      };

      const result = await verifyDocument(verifyInput, userId);

      expect(result.is_verified).toEqual(true);
      expect(result.verified_by).toEqual(userId);
      expect(result.verified_at).toBeInstanceOf(Date);
      expect(result.notes).toEqual('Document looks good');
    });

    it('should reject document with notes', async () => {
      const uploaded = await uploadDocument(testDocumentInput);

      const verifyInput: VerifyDocumentInput = {
        id: uploaded.id,
        is_verified: false,
        notes: 'Document is unclear'
      };

      const result = await verifyDocument(verifyInput, userId);

      expect(result.is_verified).toEqual(false);
      expect(result.verified_by).toEqual(userId);
      expect(result.notes).toEqual('Document is unclear');
    });

    it('should update verification status in database', async () => {
      const uploaded = await uploadDocument(testDocumentInput);

      const verifyInput: VerifyDocumentInput = {
        id: uploaded.id,
        is_verified: true,
        notes: 'Verified successfully'
      };

      await verifyDocument(verifyInput, userId);

      const documents = await db.select()
        .from(documentsTable)
        .where(eq(documentsTable.id, uploaded.id))
        .execute();

      expect(documents[0].is_verified).toEqual(true);
      expect(documents[0].verified_by).toEqual(userId);
      expect(documents[0].notes).toEqual('Verified successfully');
    });

    it('should throw error for non-existent document', async () => {
      const verifyInput: VerifyDocumentInput = {
        id: 99999,
        is_verified: true
      };

      await expect(verifyDocument(verifyInput, userId)).rejects.toThrow(/document not found/i);
    });
  });

  describe('getPendingDocuments', () => {
    it('should get pending documents only', async () => {
      // Upload and verify one document
      const doc1 = await uploadDocument(testDocumentInput);
      await verifyDocument({ id: doc1.id, is_verified: true }, userId);

      // Upload another document (unverified)
      await uploadDocument({
        ...testDocumentInput,
        document_type: 'kk',
        file_name: 'kk.pdf',
        file_path: '/uploads/kk.pdf'
      });

      const pendingDocs = await getPendingDocuments();

      expect(pendingDocs).toHaveLength(1);
      expect(pendingDocs[0].is_verified).toEqual(false);
      expect(pendingDocs[0].document_type).toEqual('kk');
    });

    it('should return empty array when no pending documents', async () => {
      const doc = await uploadDocument(testDocumentInput);
      await verifyDocument({ id: doc.id, is_verified: true }, userId);

      const pendingDocs = await getPendingDocuments();

      expect(pendingDocs).toHaveLength(0);
    });
  });

  describe('getDocumentsByType', () => {
    it('should get documents by type', async () => {
      // Upload documents of different types
      await uploadDocument(testDocumentInput);
      await uploadDocument({
        ...testDocumentInput,
        document_type: 'kk',
        file_name: 'kk.pdf',
        file_path: '/uploads/kk.pdf'
      });
      await uploadDocument({
        ...testDocumentInput,
        document_type: 'ktp',
        file_name: 'ktp2.pdf',
        file_path: '/uploads/ktp2.pdf'
      });

      const ktpDocs = await getDocumentsByType('ktp');
      const kkDocs = await getDocumentsByType('kk');

      expect(ktpDocs).toHaveLength(2);
      expect(kkDocs).toHaveLength(1);
      ktpDocs.forEach(doc => {
        expect(doc.document_type).toEqual('ktp');
      });
      expect(kkDocs[0].document_type).toEqual('kk');
    });

    it('should return empty array for type with no documents', async () => {
      const fotoDocs = await getDocumentsByType('foto');

      expect(fotoDocs).toHaveLength(0);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const uploaded = await uploadDocument(testDocumentInput);
      const result = await deleteDocument(uploaded.id);

      expect(result).toEqual(true);

      // Verify document is deleted from database
      const documents = await db.select()
        .from(documentsTable)
        .where(eq(documentsTable.id, uploaded.id))
        .execute();

      expect(documents).toHaveLength(0);
    });

    it('should return false for non-existent document', async () => {
      const result = await deleteDocument(99999);

      expect(result).toEqual(false);
    });
  });
});