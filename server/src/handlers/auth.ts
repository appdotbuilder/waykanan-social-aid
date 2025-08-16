import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

// Simple password hashing function (in production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  // This is a simple hash for demo purposes - use bcrypt in production
  return `hashed_${password}_salt`;
};

// Simple password verification function
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const expectedHash = await hashPassword(password);
  return expectedHash === hash;
};

// Simple JWT token generation (in production, use proper JWT library)
const generateToken = (userId: number, username: string): string => {
  // This is a simple token for demo purposes - use proper JWT in production
  const payload = { userId, username, timestamp: Date.now() };
  return `jwt_${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Hash the password
    const password_hash = await hashPassword(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash,
        full_name: input.full_name,
        role: input.role,
        phone: input.phone || null
      })
      .returning()
      .execute();

    const user = result[0];
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<{ user: User; token: string }> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Generate token
    const token = generateToken(user.id, user.username);

    return { user, token };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function getCurrentUser(userId: number): Promise<User> {
  try {
    // Find user by ID
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    return user;
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
}