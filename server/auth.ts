import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { UserRole } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'pizza-town-secret-token-production-2026';

export interface AuthPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    profileImage?: string;
  };
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function extractUserFromRequest(req: Request): AuthPayload | null {
  // Check authorization header
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) return null;
  return verifyToken(token);
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const payload = extractUserFromRequest(req);
  if (payload) {
    const user = db.findUserById(payload.userId);
    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
      };
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
    return;
  }
  next();
}
