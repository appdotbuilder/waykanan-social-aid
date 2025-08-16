import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput } from '../schema';
import { createUser, loginUser, getCurrentUser } from '../handlers/auth';
import { eq } from 'drizzle-orm';

// Test input data
const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  role: 'masyarakat',
  phone: '081234567890'
};

const testLoginInput: LoginInput = {
  username: 'testuser',
  password: 'password123'
};

describe('auth handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createUser', () => {
    it('should create a new user', async () => {
      const result = await createUser(testUserInput);

      // Basic field validation
      expect(result.username).toEqual('testuser');
      expect(result.email).toEqual('test@example.com');
      expect(result.full_name).toEqual('Test User');
      expect(result.role).toEqual('masyarakat');
      expect(result.phone).toEqual('081234567890');
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      
      // Password should be hashed, not plain text
      expect(result.password_hash).not.toEqual('password123');
      expect(result.password_hash).toContain('hashed_');
    });

    it('should save user to database', async () => {
      const result = await createUser(testUserInput);

      // Query database to verify user was saved
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].email).toEqual('test@example.com');
      expect(users[0].full_name).toEqual('Test User');
      expect(users[0].role).toEqual('masyarakat');
      expect(users[0].phone).toEqual('081234567890');
      expect(users[0].is_active).toBe(true);
      expect(users[0].created_at).toBeInstanceOf(Date);
    });

    it('should create user with null phone when not provided', async () => {
      const inputWithoutPhone: CreateUserInput = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        full_name: 'Test User 2',
        role: 'operator_staf'
      };

      const result = await createUser(inputWithoutPhone);

      expect(result.phone).toBeNull();
      expect(result.role).toEqual('operator_staf');
    });

    it('should handle different user roles', async () => {
      const adminInput: CreateUserInput = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        full_name: 'Admin User',
        role: 'admin_dinas',
        phone: null
      };

      const result = await createUser(adminInput);

      expect(result.role).toEqual('admin_dinas');
      expect(result.phone).toBeNull();
    });

    it('should fail when username already exists', async () => {
      // Create first user
      await createUser(testUserInput);

      // Try to create another user with same username
      const duplicateInput: CreateUserInput = {
        ...testUserInput,
        email: 'different@example.com'
      };

      await expect(createUser(duplicateInput)).rejects.toThrow();
    });

    it('should fail when email already exists', async () => {
      // Create first user
      await createUser(testUserInput);

      // Try to create another user with same email
      const duplicateInput: CreateUserInput = {
        ...testUserInput,
        username: 'differentuser'
      };

      await expect(createUser(duplicateInput)).rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await createUser(testUserInput);
    });

    it('should login with valid credentials', async () => {
      const result = await loginUser(testLoginInput);

      expect(result.user.username).toEqual('testuser');
      expect(result.user.email).toEqual('test@example.com');
      expect(result.user.full_name).toEqual('Test User');
      expect(result.user.role).toEqual('masyarakat');
      expect(result.user.is_active).toBe(true);
      
      // Token should be generated
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token).toContain('jwt_');
    });

    it('should fail with invalid username', async () => {
      const invalidInput: LoginInput = {
        username: 'nonexistent',
        password: 'password123'
      };

      await expect(loginUser(invalidInput)).rejects.toThrow(/invalid username or password/i);
    });

    it('should fail with invalid password', async () => {
      const invalidInput: LoginInput = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      await expect(loginUser(invalidInput)).rejects.toThrow(/invalid username or password/i);
    });

    it('should fail when user is inactive', async () => {
      // Deactivate the user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.username, 'testuser'))
        .execute();

      await expect(loginUser(testLoginInput)).rejects.toThrow(/user account is inactive/i);
    });

    it('should generate different tokens for different logins', async () => {
      const result1 = await loginUser(testLoginInput);
      
      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result2 = await loginUser(testLoginInput);

      expect(result1.token).not.toEqual(result2.token);
      expect(result1.user.id).toEqual(result2.user.id);
    });
  });

  describe('getCurrentUser', () => {
    let testUserId: number;

    beforeEach(async () => {
      // Create a test user
      const user = await createUser(testUserInput);
      testUserId = user.id;
    });

    it('should return user data for valid user ID', async () => {
      const result = await getCurrentUser(testUserId);

      expect(result.id).toEqual(testUserId);
      expect(result.username).toEqual('testuser');
      expect(result.email).toEqual('test@example.com');
      expect(result.full_name).toEqual('Test User');
      expect(result.role).toEqual('masyarakat');
      expect(result.phone).toEqual('081234567890');
      expect(result.is_active).toBe(true);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should fail for non-existent user ID', async () => {
      const nonExistentId = testUserId + 999;

      await expect(getCurrentUser(nonExistentId)).rejects.toThrow(/user not found/i);
    });

    it('should fail for inactive user', async () => {
      // Deactivate the user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, testUserId))
        .execute();

      await expect(getCurrentUser(testUserId)).rejects.toThrow(/user account is inactive/i);
    });

    it('should return correct user data for different roles', async () => {
      // Create an admin user
      const adminInput: CreateUserInput = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        full_name: 'Admin User',
        role: 'admin_dinas'
      };
      
      const adminUser = await createUser(adminInput);
      const result = await getCurrentUser(adminUser.id);

      expect(result.role).toEqual('admin_dinas');
      expect(result.phone).toBeNull();
    });
  });

  describe('integration tests', () => {
    it('should complete full authentication flow', async () => {
      // 1. Create user
      const user = await createUser(testUserInput);
      expect(user.username).toEqual('testuser');

      // 2. Login with created user
      const loginResult = await loginUser(testLoginInput);
      expect(loginResult.user.id).toEqual(user.id);
      expect(loginResult.token).toBeDefined();

      // 3. Get current user data
      const currentUser = await getCurrentUser(user.id);
      expect(currentUser.id).toEqual(user.id);
      expect(currentUser.username).toEqual('testuser');
    });

    it('should handle multiple users correctly', async () => {
      // Create multiple users with different roles
      const user1 = await createUser({
        username: 'user1',
        email: 'user1@example.com',
        password: 'pass1',
        full_name: 'User One',
        role: 'masyarakat'
      });

      const user2 = await createUser({
        username: 'user2',
        email: 'user2@example.com',
        password: 'pass2',
        full_name: 'User Two',
        role: 'admin_dinas'
      });

      // Both should be able to login
      const login1 = await loginUser({ username: 'user1', password: 'pass1' });
      const login2 = await loginUser({ username: 'user2', password: 'pass2' });

      expect(login1.user.id).toEqual(user1.id);
      expect(login2.user.id).toEqual(user2.id);
      expect(login1.user.role).toEqual('masyarakat');
      expect(login2.user.role).toEqual('admin_dinas');
    });
  });
});