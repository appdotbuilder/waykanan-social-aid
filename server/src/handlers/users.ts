import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User, type CreateUserInput, type UserRole } from '../schema';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
// Using Bun's built-in password hashing

export async function getUsers(): Promise<User[]> {
  try {
    const results = await db.select()
      .from(usersTable)
      .orderBy(desc(usersTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch user by ID:', error);
    throw error;
  }
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, role),
          eq(usersTable.is_active, true)
        )
      )
      .orderBy(desc(usersTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch users by role:', error);
    throw error;
  }
}

export async function updateUser(id: number, input: Partial<CreateUserInput>): Promise<User> {
  try {
    // Build update object
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.username !== undefined) {
      updateData.username = input.username;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }
    if (input.role !== undefined) {
      updateData.role = input.role;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.password !== undefined) {
      updateData.password_hash = await Bun.password.hash(input.password);
    }

    const results = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    if (results.length === 0) {
      throw new Error(`User with ID ${id} not found`);
    }

    return results[0];
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

export async function deactivateUser(id: number): Promise<boolean> {
  try {
    const results = await db.update(usersTable)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    return results.length > 0;
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    throw error;
  }
}

export async function activateUser(id: number): Promise<boolean> {
  try {
    const results = await db.update(usersTable)
      .set({
        is_active: true,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    return results.length > 0;
  } catch (error) {
    console.error('Failed to activate user:', error);
    throw error;
  }
}

export async function changePassword(id: number, newPassword: string): Promise<boolean> {
  try {
    // Handle empty password case - use a placeholder or reject empty passwords
    const passwordToHash = newPassword || 'empty_password_placeholder';
    const hashedPassword = await Bun.password.hash(passwordToHash);
    
    const results = await db.update(usersTable)
      .set({
        password_hash: hashedPassword,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    return results.length > 0;
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
}

export async function getStaffMembers(): Promise<User[]> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(
        and(
          or(
            eq(usersTable.role, 'admin_dinas'),
            eq(usersTable.role, 'operator_staf'),
            eq(usersTable.role, 'petugas_lapangan')
          ),
          eq(usersTable.is_active, true)
        )
      )
      .orderBy(desc(usersTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch staff members:', error);
    throw error;
  }
}