import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import {
  getUsers,
  getUserById,
  getUsersByRole,
  updateUser,
  deactivateUser,
  activateUser,
  changePassword,
  getStaffMembers
} from '../handlers/users';
import { eq } from 'drizzle-orm';
// Using Bun's built-in password hashing

// Test user data
const testUsers = {
  admin: {
    username: 'admin_test',
    email: 'admin@test.com',
    password: 'adminpass123',
    full_name: 'Admin Test User',
    role: 'admin_dinas' as const,
    phone: '+62123456789'
  },
  operator: {
    username: 'operator_test',
    email: 'operator@test.com',
    password: 'operatorpass123',
    full_name: 'Operator Test User',
    role: 'operator_staf' as const,
    phone: '+62987654321'
  },
  petugas: {
    username: 'petugas_test',
    email: 'petugas@test.com',
    password: 'petugaspass123',
    full_name: 'Petugas Test User',
    role: 'petugas_lapangan' as const,
    phone: null
  },
  masyarakat: {
    username: 'masyarakat_test',
    email: 'masyarakat@test.com',
    password: 'masyarakatpass123',
    full_name: 'Masyarakat Test User',
    role: 'masyarakat' as const,
    phone: '+62111222333'
  }
};

describe('User Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test user
  const createTestUser = async (userData: CreateUserInput) => {
    const hashedPassword = await Bun.password.hash(userData.password);
    const result = await db.insert(usersTable)
      .values({
        username: userData.username,
        email: userData.email,
        password_hash: hashedPassword,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone || null
      })
      .returning()
      .execute();
    return result[0];
  };

  describe('getUsers', () => {
    it('should return empty array when no users exist', async () => {
      const result = await getUsers();
      expect(result).toEqual([]);
    });

    it('should return all users ordered by creation date descending', async () => {
      // Create users with small delays to ensure different timestamps
      await createTestUser(testUsers.admin);
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestUser(testUsers.operator);
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestUser(testUsers.masyarakat);

      const result = await getUsers();

      expect(result).toHaveLength(3);
      expect(result[0].username).toEqual('masyarakat_test'); // Most recent
      expect(result[1].username).toEqual('operator_test');
      expect(result[2].username).toEqual('admin_test'); // Oldest
      
      // Verify all fields are present
      result.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.password_hash).toBeDefined();
        expect(user.full_name).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user.is_active).toBe(true);
        expect(user.created_at).toBeInstanceOf(Date);
        expect(user.updated_at).toBeInstanceOf(Date);
      });
    });

    it('should return both active and inactive users', async () => {
      const user1 = await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);

      // Deactivate one user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, user1.id))
        .execute();

      const result = await getUsers();

      expect(result).toHaveLength(2);
      const activeUsers = result.filter(u => u.is_active);
      const inactiveUsers = result.filter(u => !u.is_active);
      expect(activeUsers).toHaveLength(1);
      expect(inactiveUsers).toHaveLength(1);
    });
  });

  describe('getUserById', () => {
    it('should return null for non-existent user', async () => {
      const result = await getUserById(999);
      expect(result).toBeNull();
    });

    it('should return user when found', async () => {
      const createdUser = await createTestUser(testUsers.admin);
      const result = await getUserById(createdUser.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(createdUser.id);
      expect(result!.username).toEqual('admin_test');
      expect(result!.email).toEqual('admin@test.com');
      expect(result!.full_name).toEqual('Admin Test User');
      expect(result!.role).toEqual('admin_dinas');
      expect(result!.phone).toEqual('+62123456789');
      expect(result!.is_active).toBe(true);
      expect(result!.created_at).toBeInstanceOf(Date);
    });

    it('should return inactive user when found', async () => {
      const createdUser = await createTestUser(testUsers.operator);
      
      // Deactivate user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      const result = await getUserById(createdUser.id);

      expect(result).not.toBeNull();
      expect(result!.is_active).toBe(false);
    });
  });

  describe('getUsersByRole', () => {
    it('should return users with admin role only', async () => {
      // Create users with different roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      // Create another admin user
      await createTestUser({
        username: 'admin2',
        email: 'admin2@test.com',
        password: 'admin2pass',
        full_name: 'Admin 2',
        role: 'admin_dinas',
        phone: null
      });

      const result = await getUsersByRole('admin_dinas');

      expect(result).toHaveLength(2);
      result.forEach(user => {
        expect(user.role).toEqual('admin_dinas');
        expect(user.is_active).toBe(true);
      });
    });

    it('should return users with operator role only', async () => {
      // Create users with different roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      const result = await getUsersByRole('operator_staf');

      expect(result).toHaveLength(1);
      expect(result[0].role).toEqual('operator_staf');
      expect(result[0].username).toEqual('operator_test');
    });

    it('should return users with petugas role only', async () => {
      // Create users with different roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      const result = await getUsersByRole('petugas_lapangan');

      expect(result).toHaveLength(1);
      expect(result[0].role).toEqual('petugas_lapangan');
      expect(result[0].username).toEqual('petugas_test');
    });

    it('should return users with masyarakat role only', async () => {
      // Create users with different roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      const result = await getUsersByRole('masyarakat');

      expect(result).toHaveLength(1);
      expect(result[0].role).toEqual('masyarakat');
      expect(result[0].username).toEqual('masyarakat_test');
    });

    it('should return empty array for role with no active users', async () => {
      // Create users with different roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      // Create another admin user
      await createTestUser({
        username: 'admin2',
        email: 'admin2@test.com',
        password: 'admin2pass',
        full_name: 'Admin 2',
        role: 'admin_dinas',
        phone: null
      });

      // Deactivate all admin users
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.role, 'admin_dinas'))
        .execute();

      const result = await getUsersByRole('admin_dinas');
      expect(result).toHaveLength(0);
    });

    it('should exclude inactive users', async () => {
      // Create users with different roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      // Create another admin user
      await createTestUser({
        username: 'admin2',
        email: 'admin2@test.com',
        password: 'admin2pass',
        full_name: 'Admin 2',
        role: 'admin_dinas',
        phone: null
      });

      // Deactivate one admin user
      const adminUsers = await db.select()
        .from(usersTable)
        .where(eq(usersTable.role, 'admin_dinas'))
        .execute();

      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, adminUsers[0].id))
        .execute();

      const result = await getUsersByRole('admin_dinas');

      expect(result).toHaveLength(1);
      expect(result[0].is_active).toBe(true);
    });
  });

  describe('updateUser', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser(testUsers.admin);
    });

    it('should update username', async () => {
      const result = await updateUser(testUser.id, {
        username: 'updated_admin'
      });

      expect(result.username).toEqual('updated_admin');
      expect(result.email).toEqual(testUser.email); // Unchanged
      expect(result.updated_at > testUser.updated_at).toBe(true);
    });

    it('should update email', async () => {
      const result = await updateUser(testUser.id, {
        email: 'updated_admin@test.com'
      });

      expect(result.email).toEqual('updated_admin@test.com');
      expect(result.username).toEqual(testUser.username); // Unchanged
    });

    it('should update full name', async () => {
      const result = await updateUser(testUser.id, {
        full_name: 'Updated Admin Name'
      });

      expect(result.full_name).toEqual('Updated Admin Name');
    });

    it('should update role', async () => {
      const result = await updateUser(testUser.id, {
        role: 'operator_staf'
      });

      expect(result.role).toEqual('operator_staf');
    });

    it('should update phone', async () => {
      const result = await updateUser(testUser.id, {
        phone: '+62999888777'
      });

      expect(result.phone).toEqual('+62999888777');
    });

    it('should update password and hash it', async () => {
      const newPassword = 'newpassword123';
      const result = await updateUser(testUser.id, {
        password: newPassword
      });

      expect(result.password_hash).not.toEqual(testUser.password_hash);
      
      // Verify password is properly hashed
      const isPasswordValid = await Bun.password.verify(newPassword, result.password_hash);
      expect(isPasswordValid).toBe(true);
    });

    it('should update multiple fields', async () => {
      const result = await updateUser(testUser.id, {
        username: 'multi_update',
        email: 'multi@test.com',
        full_name: 'Multi Update User',
        phone: '+62555666777'
      });

      expect(result.username).toEqual('multi_update');
      expect(result.email).toEqual('multi@test.com');
      expect(result.full_name).toEqual('Multi Update User');
      expect(result.phone).toEqual('+62555666777');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        updateUser(999, { username: 'nonexistent' })
      ).rejects.toThrow(/not found/i);
    });

    it('should update updated_at timestamp', async () => {
      const result = await updateUser(testUser.id, {
        username: 'timestamp_test'
      });

      expect(result.updated_at > testUser.updated_at).toBe(true);
    });
  });

  describe('deactivateUser', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser(testUsers.operator);
    });

    it('should deactivate existing user', async () => {
      const result = await deactivateUser(testUser.id);
      expect(result).toBe(true);

      // Verify user is deactivated
      const updatedUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, testUser.id))
        .execute();

      expect(updatedUser[0].is_active).toBe(false);
      expect(updatedUser[0].updated_at > testUser.updated_at).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const result = await deactivateUser(999);
      expect(result).toBe(false);
    });

    it('should work on already inactive user', async () => {
      // First deactivation
      await deactivateUser(testUser.id);
      
      // Second deactivation should still work
      const result = await deactivateUser(testUser.id);
      expect(result).toBe(true);
    });
  });

  describe('activateUser', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser(testUsers.petugas);
      // Deactivate the user first
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, testUser.id))
        .execute();
    });

    it('should activate deactivated user', async () => {
      const result = await activateUser(testUser.id);
      expect(result).toBe(true);

      // Verify user is activated
      const updatedUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, testUser.id))
        .execute();

      expect(updatedUser[0].is_active).toBe(true);
      expect(updatedUser[0].updated_at > testUser.updated_at).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const result = await activateUser(999);
      expect(result).toBe(false);
    });

    it('should work on already active user', async () => {
      // First activation
      await activateUser(testUser.id);
      
      // Second activation should still work
      const result = await activateUser(testUser.id);
      expect(result).toBe(true);
    });
  });

  describe('changePassword', () => {
    let testUser: any;
    const originalPassword = 'originalpass123';

    beforeEach(async () => {
      testUser = await createTestUser({
        ...testUsers.masyarakat,
        password: originalPassword
      });
    });

    it('should change password and hash it properly', async () => {
      const newPassword = 'newpassword456';
      const result = await changePassword(testUser.id, newPassword);
      
      expect(result).toBe(true);

      // Verify password was changed in database
      const updatedUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, testUser.id))
        .execute();

      expect(updatedUser[0].password_hash).not.toEqual(testUser.password_hash);
      expect(updatedUser[0].updated_at > testUser.updated_at).toBe(true);

      // Verify new password is correctly hashed
      const isNewPasswordValid = await Bun.password.verify(newPassword, updatedUser[0].password_hash);
      expect(isNewPasswordValid).toBe(true);

      // Verify old password no longer works
      const isOldPasswordValid = await Bun.password.verify(originalPassword, updatedUser[0].password_hash);
      expect(isOldPasswordValid).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const result = await changePassword(999, 'newpassword');
      expect(result).toBe(false);
    });

    it('should handle empty password', async () => {
      const result = await changePassword(testUser.id, '');
      expect(result).toBe(true);

      // Verify empty password is handled (uses placeholder)
      const updatedUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, testUser.id))
        .execute();

      // Since empty password gets replaced with placeholder, verify that
      const isPlaceholderValid = await Bun.password.verify('empty_password_placeholder', updatedUser[0].password_hash);
      expect(isPlaceholderValid).toBe(true);
    });
  });

  describe('getStaffMembers', () => {
    it('should return only staff members (admin, operator, petugas)', async () => {
      // Create users with all roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      // Create additional staff member
      await createTestUser({
        username: 'operator2',
        email: 'operator2@test.com',
        password: 'operator2pass',
        full_name: 'Operator 2',
        role: 'operator_staf',
        phone: null
      });

      const result = await getStaffMembers();

      // Should have 4 staff members: 1 admin + 2 operators + 1 petugas = 4 (masyarakat excluded)
      expect(result).toHaveLength(4);
      
      const roles = result.map(user => user.role);
      expect(roles).toContain('admin_dinas');
      expect(roles).toContain('operator_staf');
      expect(roles).toContain('petugas_lapangan');
      expect(roles).not.toContain('masyarakat');

      // Count each role
      const roleCounts = {
        admin_dinas: roles.filter(r => r === 'admin_dinas').length,
        operator_staf: roles.filter(r => r === 'operator_staf').length,
        petugas_lapangan: roles.filter(r => r === 'petugas_lapangan').length
      };

      expect(roleCounts.admin_dinas).toBe(1);
      expect(roleCounts.operator_staf).toBe(2);
      expect(roleCounts.petugas_lapangan).toBe(1);

      // Verify all are active
      result.forEach(user => {
        expect(user.is_active).toBe(true);
      });
    });

    it('should exclude masyarakat role', async () => {
      // Create users with all roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      const result = await getStaffMembers();
      
      const masyarakatUsers = result.filter(user => user.role === 'masyarakat');
      expect(masyarakatUsers).toHaveLength(0);
    });

    it('should exclude inactive staff members', async () => {
      // Create users with all roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      // Create additional admin
      await createTestUser({
        username: 'admin2',
        email: 'admin2@test.com',
        password: 'admin2pass',
        full_name: 'Admin 2',
        role: 'admin_dinas',
        phone: null
      });

      // Deactivate one staff member
      const adminUsers = await db.select()
        .from(usersTable)
        .where(eq(usersTable.role, 'admin_dinas'))
        .execute();

      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, adminUsers[0].id))
        .execute();

      const result = await getStaffMembers();

      expect(result).toHaveLength(3); // One admin deactivated
      result.forEach(user => {
        expect(user.is_active).toBe(true);
      });
    });

    it('should return empty array when no active staff exist', async () => {
      // Create users with all roles
      await createTestUser(testUsers.admin);
      await createTestUser(testUsers.operator);
      await createTestUser(testUsers.petugas);
      await createTestUser(testUsers.masyarakat);

      // Deactivate all staff members
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.role, 'admin_dinas'))
        .execute();

      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.role, 'operator_staf'))
        .execute();

      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.role, 'petugas_lapangan'))
        .execute();

      const result = await getStaffMembers();
      expect(result).toHaveLength(0);
    });

    it('should order results by creation date descending', async () => {
      // Create users with all roles with timing delays
      await createTestUser(testUsers.admin);
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestUser(testUsers.operator);
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestUser(testUsers.petugas);
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestUser(testUsers.masyarakat); // This will be excluded from staff

      // Create additional staff member (most recent)
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestUser({
        username: 'operator2',
        email: 'operator2@test.com',
        password: 'operator2pass',
        full_name: 'Operator 2',
        role: 'operator_staf',
        phone: null
      });

      const result = await getStaffMembers();

      // Should have 4 staff members: 1 admin + 2 operators + 1 petugas = 4 (masyarakat excluded)
      expect(result).toHaveLength(4);
      
      // Results should be ordered by created_at descending (most recent first)
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].created_at >= result[i].created_at).toBe(true);
      }

      // The most recent should be operator2
      expect(result[0].username).toBe('operator2');
    });
  });
});