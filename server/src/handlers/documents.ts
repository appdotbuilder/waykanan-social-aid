import { db } from '../db';
import { documentsTable, recipientsTable } from '../db/schema';
import { type UploadDocumentInput, type VerifyDocumentInput, type Document, type DocumentType } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function uploadDocument(input: UploadDocumentInput): Promise<Document> {
  try {
    // Verify recipient exists
    const recipient = await db.select()
      .from(recipientsTable)
      .where(eq(recipientsTable.id, input.recipient_id))
      .execute();

    if (recipient.length === 0) {
      throw new Error('Recipient not found');
    }

    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        recipient_id: input.recipient_id,
        document_type: input.document_type,
        file_name: input.file_name,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        is_verified: false,
        verified_by: null,
        verified_at: null,
        notes: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
}

export async function getDocumentsByRecipient(recipientId: number): Promise<Document[]> {
  try {
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.recipient_id, recipientId))
      .execute();

    return documents;
  } catch (error) {
    console.error('Failed to get documents by recipient:', error);
    throw error;
  }
}

export async function getDocumentById(id: number): Promise<Document | null> {
  try {
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, id))
      .execute();

    return documents.length > 0 ? documents[0] : null;
  } catch (error) {
    console.error('Failed to get document by ID:', error);
    throw error;
  }
}

export async function verifyDocument(input: VerifyDocumentInput, verifiedBy: number): Promise<Document> {
  try {
    // Check if document exists
    const existing = await getDocumentById(input.id);
    if (!existing) {
      throw new Error('Document not found');
    }

    // Update document verification status
    const result = await db.update(documentsTable)
      .set({
        is_verified: input.is_verified,
        verified_by: verifiedBy,
        verified_at: new Date(),
        notes: input.notes || null
      })
      .where(eq(documentsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document verification failed:', error);
    throw error;
  }
}

export async function getPendingDocuments(): Promise<Document[]> {
  try {
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.is_verified, false))
      .execute();

    return documents;
  } catch (error) {
    console.error('Failed to get pending documents:', error);
    throw error;
  }
}

export async function getDocumentsByType(documentType: DocumentType): Promise<Document[]> {
  try {
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.document_type, documentType))
      .execute();

    return documents;
  } catch (error) {
    console.error('Failed to get documents by type:', error);
    throw error;
  }
}

export async function deleteDocument(id: number): Promise<boolean> {
  try {
    // Check if document exists
    const existing = await getDocumentById(id);
    if (!existing) {
      return false;
    }

    // Delete document record
    await db.delete(documentsTable)
      .where(eq(documentsTable.id, id))
      .execute();

    return true;
  } catch (error) {
    console.error('Document deletion failed:', error);
    throw error;
  }
}