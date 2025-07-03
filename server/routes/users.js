import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register a new warehouse
router.post('/register/warehouse', async (req, res) => {
  try {
    const { name, phone, email, photo, address, commercialRecord, accountNumbers, password } = req.body;
    const user = new User({
      name,
      phone,
      email,
      photo,
      address,
      commercialRecord,
      accountNumbers,
      password,
      type: 'warehouse'
    });
    await user.save();
    res.status(201).json({ message: 'Warehouse registered successfully', user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Failed to register warehouse', error: error.message });
  }
});

// Register a new exhibition
router.post('/register/exhibition', async (req, res) => {
  try {
    const { name, phone, email, photo, address, password } = req.body;
    const user = new User({
      name,
      phone,
      email,
      photo,
      address,
      password,
      type: 'exhibition'
    });
    await user.save();
    res.status(201).json({ message: 'Exhibition registered successfully', user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Failed to register exhibition', error: error.message });
  }
});

// Get all warehouses
router.get('/warehouses', authenticate, async (req, res) => {
  try {
    const warehouses = await User.find({ type: 'warehouse' }).select('-password');
    res.json({ warehouses, count: warehouses.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch warehouses' });
  }
});

// Get all exhibitions
router.get('/exhibitions', authenticate, async (req, res) => {
  try {
    const exhibitions = await User.find({ type: 'exhibition' }).select('-password');
    res.json({ exhibitions, count: exhibitions.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exhibitions' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user by ID
router.put('/:id', authenticate, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) delete updateData.password; // Password change should be separate
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Change user password
router.put('/:id/password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
});

export default router;