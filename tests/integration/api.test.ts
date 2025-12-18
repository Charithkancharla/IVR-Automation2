import { Hono } from 'hono';
import { authMiddleware } from '../../src/middleware/auth-middleware';
import authRoutes from '../../src/routes/auth-routes';
import { generateJWT } from '../../src/services/auth';

// Mock D1 database
const mockDB = {
  prepare: jest.fn().mockReturnThis(),
  bind: jest.fn().mockReturnThis(),
  first: jest.fn(),
  all: jest.fn(),
  run: jest.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
};

// Mock environment
const mockEnv = {
  DB: mockDB,
  JWT_SECRET: 'test-secret-key',
};

describe('API Integration Tests', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('/api/*', authMiddleware);
    app.route('/api/auth', authRoutes);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Authentication Routes', () => {
    it('should register a new user', async () => {
      mockDB.first.mockResolvedValue(null); // No existing user
      
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      }, mockEnv);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('User registered successfully');
    });

    it('should login an existing user', async () => {
      const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01'; // Mock bcrypt hash
      mockDB.first.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'user',
      });
      
      // Mock verifyPassword to return true
      jest.mock('../../src/services/auth', () => ({
        ...jest.requireActual('../../src/services/auth'),
        verifyPassword: jest.fn().mockResolvedValue(true),
      }));

      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      }, mockEnv);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      mockDB.first.mockResolvedValue(null); // User not found

      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'nonexistent',
          password: 'wrongpassword',
        }),
      }, mockEnv);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid credentials');
    });
  });

  describe('Protected Routes', () => {
    it('should allow access to protected routes with valid token', async () => {
      // Create a valid token
      const token = generateJWT({ id: 1, username: 'testuser' }, mockEnv.JWT_SECRET);
      
      // Mock a protected route
      app.get('/api/protected', (c) => {
        return c.json({ message: 'Access granted', user: c.get('user') });
      });

      const response = await app.request('/api/protected', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }, mockEnv);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Access granted');
      expect(data.user).toBeDefined();
    });

    it('should reject access to protected routes without token', async () => {
      // Mock a protected route
      app.get('/api/protected', (c) => {
        return c.json({ message: 'Access granted' });
      });

      const response = await app.request('/api/protected', {}, mockEnv);

      expect(response.status).toBe(401);
    });

    it('should reject access to protected routes with invalid token', async () => {
      // Mock a protected route
      app.get('/api/protected', (c) => {
        return c.json({ message: 'Access granted' });
      });

      const response = await app.request('/api/protected', {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      }, mockEnv);

      expect(response.status).toBe(401);
    });
  });
});