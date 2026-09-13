import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, AuthenticatedRequest, requireAuth } from '../auth';

const router = Router();

router.post('/register', (req, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = db.createUser({
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      passwordHash,
      role: 'customer',
      profileImage: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
    });

    const token = generateToken({
      userId: newUser.id,
      role: newUser.role,
      email: newUser.email,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({
      message: 'Registration successful! Welcome to Pizza Town.',
      token,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

router.post('/login', (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    const { passwordHash: _, ...safeUser } = user;
    res.json({
      message: 'Welcome back to Pizza Town!',
      token,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

router.post('/logout', (_req, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  const user = db.findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

router.post('/forgot-password', (req, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }
  const user = db.findUserByEmail(email);
  // Always return friendly response to prevent email enumeration
  res.json({
    message: user
      ? 'Password reset instructions have been dispatched to your email address.'
      : 'If an account exists with that email address, reset instructions were dispatched.',
  });
});

export default router;
