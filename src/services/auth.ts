// Authentication Service for IVR Automation Testing Platform

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotificationPreferences {
  id: number;
  userId: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  slackEnabled: boolean;
  emailAddresses: string[];
  phoneNumbers: string[];
  slackWebhooks: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  exp: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  // In a real implementation, we would use bcrypt or similar
  // For this example, we'll use a simple hash function
  // Note: This is NOT secure for production use
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

/**
 * Generate a JWT token
 */
export function generateJWT(payload: Omit<JWTPayload, 'exp'>, secret: string, expiresIn: number = 3600): string {
  // In a real implementation, we would use a proper JWT library
  // For this example, we'll create a simple token structure
  const jwtPayload: JWTPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresIn
  };
  
  // Simple base64 encoding (NOT secure for production)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadEncoded = btoa(JSON.stringify(jwtPayload));
  const signature = btoa(`${header}.${payloadEncoded}.${secret}`);
  
  return `${header}.${payloadEncoded}.${signature}`;
}

/**
 * Verify a JWT token
 */
export function verifyJWT(token: string, secret: string): JWTPayload | null {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = btoa(`${header}.${payload}.${secret}`);
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payloadObj = JSON.parse(atob(payload));
    
    // Check expiration
    if (payloadObj.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payloadObj;
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate a user
 */
export async function authenticateUser(credentials: LoginCredentials, db: D1Database): Promise<User | null> {
  try {
    const user = await db.prepare(
      'SELECT * FROM users WHERE username = ? AND is_active = 1'
    ).bind(credentials.username).first();
    
    if (!user) {
      return null;
    }
    
    const isValid = await verifyPassword(credentials.password, user.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    // Update last login
    await db.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: user.is_active === 1,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(userData: RegisterData, db: D1Database): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(userData.password);
    
    const result = await db.prepare(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userData.username,
      userData.email,
      hashedPassword,
      userData.firstName || null,
      userData.lastName || null,
      'user' // Default role
    ).run();
    
    if (!result.success) {
      return null;
    }
    
    const user = await db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(result.meta.last_row_id).first();
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: user.is_active === 1,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number, db: D1Database): Promise<User | null> {
  try {
    const user = await db.prepare(
      'SELECT * FROM users WHERE id = ? AND is_active = 1'
    ).bind(userId).first();
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: user.is_active === 1,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId: number, db: D1Database): Promise<UserNotificationPreferences | null> {
  try {
    const prefs = await db.prepare(
      'SELECT * FROM user_notification_preferences WHERE user_id = ?'
    ).bind(userId).first();
    
    if (!prefs) {
      // Return default preferences if none exist
      return {
        id: 0,
        userId,
        emailEnabled: true,
        smsEnabled: false,
        slackEnabled: false,
        emailAddresses: [],
        phoneNumbers: [],
        slackWebhooks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    return {
      id: prefs.id,
      userId: prefs.user_id,
      emailEnabled: prefs.email_enabled === 1,
      smsEnabled: prefs.sms_enabled === 1,
      slackEnabled: prefs.slack_enabled === 1,
      emailAddresses: prefs.email_addresses ? JSON.parse(prefs.email_addresses) : [],
      phoneNumbers: prefs.phone_numbers ? JSON.parse(prefs.phone_numbers) : [],
      slackWebhooks: prefs.slack_webhooks ? JSON.parse(prefs.slack_webhooks) : [],
      createdAt: new Date(prefs.created_at),
      updatedAt: new Date(prefs.updated_at)
    };
  } catch (error) {
    console.error('Get user notification preferences error:', error);
    // Return default preferences on error
    return {
      id: 0,
      userId,
      emailEnabled: true,
      smsEnabled: false,
      slackEnabled: false,
      emailAddresses: [],
      phoneNumbers: [],
      slackWebhooks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

/**
 * Update user notification preferences
 */
export async function updateUserNotificationPreferences(
  userId: number, 
  preferences: Omit<UserNotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, 
  db: D1Database
): Promise<boolean> {
  try {
    // Check if preferences already exist
    const existing = await db.prepare(
      'SELECT id FROM user_notification_preferences WHERE user_id = ?'
    ).bind(userId).first();
    
    if (existing) {
      // Update existing preferences
      await db.prepare(`
        UPDATE user_notification_preferences 
        SET email_enabled = ?, sms_enabled = ?, slack_enabled = ?, 
            email_addresses = ?, phone_numbers = ?, slack_webhooks = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(
        preferences.emailEnabled ? 1 : 0,
        preferences.smsEnabled ? 1 : 0,
        preferences.slackEnabled ? 1 : 0,
        JSON.stringify(preferences.emailAddresses),
        JSON.stringify(preferences.phoneNumbers),
        JSON.stringify(preferences.slackWebhooks),
        userId
      ).run();
    } else {
      // Create new preferences
      await db.prepare(`
        INSERT INTO user_notification_preferences 
        (user_id, email_enabled, sms_enabled, slack_enabled, email_addresses, phone_numbers, slack_webhooks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        preferences.emailEnabled ? 1 : 0,
        preferences.smsEnabled ? 1 : 0,
        preferences.slackEnabled ? 1 : 0,
        JSON.stringify(preferences.emailAddresses),
        JSON.stringify(preferences.phoneNumbers),
        JSON.stringify(preferences.slackWebhooks)
      ).run();
    }
    
    return true;
  } catch (error) {
    console.error('Update user notification preferences error:', error);
    return false;
  }
}