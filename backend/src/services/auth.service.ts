import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config/config';
import { db, queries } from '../db/database';
import { hashPassword, verifyPassword, generateId, hashToken } from '../utils/crypto';
import { MailcowService } from './mailcow.service';

interface CustomJWTPayload {
  sub: string; // user id
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

export class AuthService {
  private secret: Uint8Array;
  private mailcowService: MailcowService;

  constructor() {
    this.secret = new TextEncoder().encode(config.jwt.secret);
    this.mailcowService = new MailcowService();
  }

  // Generate JWT token
  async generateToken(user: User): Promise<string> {
    const jwt = await new SignJWT({
      sub: user.id,
      email: user.email,
      isAdmin: Boolean(user.is_admin),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(config.jwt.expiresIn)
      .sign(this.secret);

    return jwt;
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      
      // Validate required properties
      if (typeof payload.sub !== 'string' || 
          typeof payload.email !== 'string' || 
          typeof payload.isAdmin !== 'boolean') {
        return null;
      }
      
      return payload as unknown as CustomJWTPayload;
    } catch (error) {
      return null;
    }
  }

  // Register new user
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = queries.users.findByEmail.get({ $email: email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Check if email is admin
    const isAdmin = email === config.admin.email;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateId();
    queries.users.create.run({
      $id: userId,
      $email: email,
      $password_hash: passwordHash,
      $name: name,
      $is_admin: isAdmin ? 1 : 0,
    });

    const user = queries.users.findById.get({ $id: userId }) as User;
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate token
    const token = await this.generateToken(user);

    return { user, token };
  }

  // Login user
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user
    const user = queries.users.findByEmail.get({ $email: email }) as User | undefined;
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(user.password_hash, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = await this.generateToken(user);

    return { user, token };
  }

  // Get user from token
  async getUserFromToken(token: string): Promise<User | null> {
    const payload = await this.verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = queries.users.findById.get({ $id: payload.sub }) as User | undefined;
    return user || null;
  }

  // Create session token (for refresh tokens)
  async createSessionToken(userId: string): Promise<string> {
    const token = generateId();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    db.prepare(`
      INSERT INTO session_tokens (id, user_id, token_hash, expires_at)
      VALUES ($id, $user_id, $token_hash, $expires_at)
    `).run({
      $id: generateId(),
      $user_id: userId,
      $token_hash: tokenHash,
      $expires_at: expiresAt.toISOString(),
    });

    return token;
  }

  // Validate session token
  async validateSessionToken(token: string): Promise<User | null> {
    const tokenHash = await hashToken(token);
    
    const session = db.prepare(`
      SELECT s.*, u.*
      FROM session_tokens s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = $token_hash
      AND s.expires_at > datetime('now')
    `).get({ $token_hash: tokenHash }) as any;

    if (!session) {
      return null;
    }

    return {
      id: session.user_id,
      email: session.email,
      password_hash: session.password_hash,
      name: session.name,
      is_admin: session.is_admin,
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  }

  // Revoke session token
  async revokeSessionToken(token: string): Promise<void> {
    const tokenHash = await hashToken(token);
    
    db.prepare(`
      DELETE FROM session_tokens
      WHERE token_hash = $token_hash
    `).run({ $token_hash: tokenHash });
  }

  // Clean expired tokens
  async cleanExpiredTokens(): Promise<void> {
    db.prepare(`
      DELETE FROM session_tokens
      WHERE expires_at < datetime('now')
    `).run();
  }
} 