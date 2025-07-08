import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = express.Router();

console.log('USERS ROUTE LOADED');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.Cloud_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// إعداد التخزين على Cloudinary للمستخدمين
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

const upload = multer({ storage: storage });

// Register a new warehouse
router.post('/register/warehouse', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, address, commercialRecord, accountNumbers, password, taxNumber } = req.body;
    const safeTaxNumber = taxNumber || '0000'; // قيمة افتراضية مؤقتة
    // توليد كود المستودع
    let lastWarehouse = await User.findOne({ type: 'warehouse' }).sort({ createdAt: -1 });
    console.log('lastWarehouse:', lastWarehouse);
    let nextNumber = 1;
    if (lastWarehouse && lastWarehouse.warehouseCode) {
      const match = lastWarehouse.warehouseCode.match(/wh(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    } else {
      nextNumber = 1;
    }
    const warehouseCode = `wh${nextNumber}`;
    console.log('req.body:', req.body);
    console.log('Generated warehouseCode:', warehouseCode);
    const user = new User({
      name,
      phone,
      email,
      photo: req.file ? req.file.path : null,
      address,
      commercialRecord,
      accountNumbers,
      password,
      taxNumber: safeTaxNumber,
      warehouseCode,
      type: 'warehouse'
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Warehouse registered successfully', user, token });
  } catch (error) {
    console.error('Error while saving user:', error);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or warehouse code already exists' });
    }
    res.status(500).json({ message: 'Failed to register warehouse', error: error.message });
  }
});

// Register a new exhibition
router.post('/register/exhibition', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, address, password, taxNumber } = req.body;
    const user = new User({
      name,
      phone,
      email,
      photo: req.file ? req.file.path : null,
      address,
      password,
      taxNumber,
      type: 'exhibition'
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Exhibition registered successfully', user, token });
  } catch (error) {
    console.error('Error while saving user:', error);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
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
router.put('/:id', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) delete updateData.password; // Password change should be separate
    
    if (req.file) {
      updateData.photo = req.file.path;
      
      // حذف الصورة القديمة إذا كانت موجودة
      const existingUser = await User.findById(req.params.id);
      if (existingUser && existingUser.photo) {
        // حذف الصورة من Cloudinary
        const cloudinaryPublicId = existingUser.photo.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(cloudinaryPublicId);
      }
    }
    
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