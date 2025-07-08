import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export interface AuthContext {
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
  } | null;
}

// Middleware to validate JWT token
export async function authMiddleware(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null };
  }

  const token = authHeader.substring(7);
  const payload = await authService.verifyToken(token);
  
  if (!payload) {
    return { user: null };
  }

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin,
    },
  };
}

// Helper to require authentication
export function requireAuth(context: AuthContext): void {
  if (!context.user) {
    throw new Error('Authentication required');
  }
}

// Helper to require admin access
export function requireAdmin(context: AuthContext): void {
  requireAuth(context);
  if (!context.user!.isAdmin) {
    throw new Error('Admin access required');
  }
} 