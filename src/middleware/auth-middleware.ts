// Authentication Middleware for IVR Automation Testing Platform
import { verifyJWT } from '../services/auth';

export interface UserPayload {
  userId: number;
  username: string;
  role: string;
  exp: number;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: UserPayload;
  }
}

/**
 * Middleware to verify JWT token and protect routes
 */
export const authMiddleware = async (c: any, next: any) => {
  // Skip authentication for public routes
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/',
    '/static/'
  ];
  
  const path = c.req.path;
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  if (isPublicRoute) {
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
};