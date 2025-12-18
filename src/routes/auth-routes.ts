// Authentication Routes for IVR Automation Testing Platform
import { Hono } from 'hono';
import { 
  authenticateUser, 
  registerUser, 
  getUserById, 
  generateJWT, 
  verifyJWT,
  LoginCredentials,
  RegisterData
} from '../services/auth';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const authRoutes = new Hono<{ Bindings: Bindings }>();

// Middleware to verify JWT token
authRoutes.use('*', async (c, next) => {
  // Skip authentication for login and register routes
  if (c.req.path === '/api/auth/login' || c.req.path === '/api/auth/register') {
    return next();
  }
  
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Missing or invalid authorization header' }, 401);
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const payload = verifyJWT(token, c.env.JWT_SECRET);
  
  if (!payload) {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
  
  // Add user info to context
  c.set('user', payload);
  await next();
});

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const { DB, JWT_SECRET } = c.env;
    const credentials: LoginCredentials = await c.req.json();
    
    if (!credentials.username || !credentials.password) {
      return c.json({ success: false, message: 'Username and password are required' }, 400);
    }
    
    const user = await authenticateUser(credentials, DB);
    
    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }
    
    const token = generateJWT(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      3600 // 1 hour expiry
    );
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'Login failed' }, 500);
  }
});

// Register endpoint
authRoutes.post('/register', async (c) => {
  try {
    const { DB } = c.env;
    const userData: RegisterData = await c.req.json();
    
    // Validate required fields
    if (!userData.username || !userData.email || !userData.password) {
      return c.json({ success: false, message: 'Username, email, and password are required' }, 400);
    }
    
    // Check if user already exists
    const existingUser = await DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(userData.username, userData.email).first();
    
    if (existingUser) {
      return c.json({ success: false, message: 'Username or email already exists' }, 400);
    }
    
    const user = await registerUser(userData, DB);
    
    if (!user) {
      return c.json({ success: false, message: 'Registration failed' }, 500);
    }
    
    return c.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, message: 'Registration failed' }, 500);
  }
});

// Get current user profile
authRoutes.get('/profile', async (c) => {
  try {
    const { DB } = c.env;
    const userPayload = c.get('user');
    
    const user = await getUserById(userPayload.userId, DB);
    
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    return c.json({ success: false, message: 'Failed to fetch profile' }, 500);
  }
});

// Logout endpoint (client-side token removal)
authRoutes.post('/logout', (c) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  return c.json({ success: true, message: 'Logged out successfully' });
});

export default authRoutes;