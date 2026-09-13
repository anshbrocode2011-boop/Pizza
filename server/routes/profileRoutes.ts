import { Router, Response } from 'express';
import { db } from '../db';
import { AuthenticatedRequest, requireAuth } from '../auth';
import { Address } from '../../src/types';

const router = Router();

// GET /api/profile
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const addresses = db.getAddressesByUserId(user.id);
  const orders = db.getOrdersByUserId(user.id);
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    user: safeUser,
    addresses,
    ordersCount: orders.length,
    recentOrders: orders.slice(0, 3),
  });
});

// PUT /api/profile - Update personal information
router.put('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, profileImage } = req.body;
    const updates: any = {};

    if (name && typeof name === 'string') updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (profileImage && typeof profileImage === 'string') updates.profileImage = profileImage.trim();

    const updated = db.updateUser(req.user!.id, updates);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const { passwordHash: _, ...safeUser } = updated;
    res.json({ message: 'Profile updated successfully!', user: safeUser });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET /api/profile/addresses
router.get('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const addresses = db.getAddressesByUserId(req.user!.id);
  res.json({ addresses });
});

// POST /api/profile/addresses - Add saved address
router.post('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, phone, street, city, state, zipCode, instructions, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !state || !zipCode) {
      res.status(400).json({ error: 'All address fields (Full Name, Phone, Street, City, State, ZIP) are required.' });
      return;
    }

    const newAddress: Address = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user!.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      instructions: instructions ? instructions.trim() : undefined,
      isDefault: Boolean(isDefault),
    };

    const saved = db.addAddress(newAddress);
    res.status(201).json({ message: 'Address saved successfully!', address: saved });
  } catch (error: any) {
    console.error('Error saving address:', error);
    res.status(500).json({ error: 'Failed to save address.' });
  }
});

// DELETE /api/profile/addresses/:id
router.delete('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteAddress(req.params.id, req.user!.id);
  if (!success) {
    res.status(404).json({ error: 'Address not found.' });
    return;
  }
  res.json({ message: 'Address deleted successfully.' });
});

export default router;
