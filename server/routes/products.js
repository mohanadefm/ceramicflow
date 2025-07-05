import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

cloudinary.config({
  cloud_name: process.env.Cloud_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({ storage });

// Get all products for the current warehouse (user)
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      sku,
      lowStock,
      page = 1,
      limit = 50,
      hasOffer
    } = req.query;

    // Build filter
    const filter = { warehouse: req.user._id };
    if (hasOffer === 'true') {
      filter.hasOffer = true;
      filter.status = 'active';
    } else if (hasOffer === 'false') {
      filter.hasOffer = false;
    }
    if (req.query.forOffers === 'true') {
      filter.status = 'active';
    }
    if (req.query.code) {
      filter.$or = [
        { sku: { $regex: req.query.code, $options: 'i' } },
        { code: { $regex: req.query.code, $options: 'i' } }
      ];
    } else if (sku) {
      filter.sku = { $regex: sku, $options: 'i' };
    }
    if (lowStock === 'true') {
      filter.$or = [
        { quantityInMeters: { $lt: 201 } },
        // { quantityInBoxes: { $lt: 500 } }
      ];
    }
    if (req.query.category) {
      filter.category = { $regex: `^${req.query.category}$`, $options: 'i' };
    }
    if (req.query.color) {
      filter.color = { $regex: `^${req.query.color}$`, $options: 'i' };
    }
    if (req.query.country) {
      filter.country = { $regex: `^${req.query.country}$`, $options: 'i' };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('warehouse', 'name');

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: products.length,
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Create new product (warehouse only)
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    // Check if SKU already exists for this specific warehouse (user)
    const existingProduct = await Product.findOne({ 
      sku: req.body.sku, 
      warehouse: req.user._id 
    });
    
    if (existingProduct) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(400).json({ message: 'SKU already exists for this warehouse, please choose a unique SKU.' });
    }

    const productData = {
      ...req.body,
      warehouse: req.user._id,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      quantityInMeters: req.body.quantityInMeters ? parseFloat(req.body.quantityInMeters) : undefined,
      quantityInBoxes: req.body.quantityInBoxes ? parseInt(req.body.quantityInBoxes) : undefined,
      length: req.body.length ? parseFloat(req.body.length) : undefined,
      width: req.body.width ? parseFloat(req.body.width) : undefined,
      thickness: req.body.thickness ? parseFloat(req.body.thickness) : undefined
    };
    if (req.file && req.file.path) {
      productData.image = req.file.path;
    }
    const product = new Product(productData);
    await product.save();
    const populatedProduct = await Product.findById(product._id).populate('warehouse', 'name');
    res.status(201).json({ message: 'Product created successfully', product: populatedProduct });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product (warehouse only)
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, warehouse: req.user._id });
    if (!product) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(404).json({ message: 'Product not found' });
    }
    const updateData = {
      ...req.body,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      quantityInMeters: req.body.quantityInMeters ? parseFloat(req.body.quantityInMeters) : undefined,
      quantityInBoxes: req.body.quantityInBoxes ? parseInt(req.body.quantityInBoxes) : undefined,
      length: req.body.length ? parseFloat(req.body.length) : undefined,
      width: req.body.width ? parseFloat(req.body.width) : undefined,
      thickness: req.body.thickness ? parseFloat(req.body.thickness) : undefined
    };
    if (req.file && req.file.path) {
      updateData.image = req.file.path;
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true }).populate('warehouse', 'name');
    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Update product status (active/inactive)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const product = await Product.findOneAndUpdate(
      { _id: id, warehouse: req.user._id },
      { status },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Status updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id, warehouse: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Get product by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('warehouse', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Product statistics for a warehouse
router.get('/warehouse/:warehouseId/statistics', authenticate, async (req, res) => {
  try {
    const { warehouseId } = req.params;
    // اجلب كل المنتجات لهذا المستودع
    const products = await Product.find({ warehouse: warehouseId });

    // احسب الإحصائيات
    const totalQuantityM2 = products.reduce((sum, p) => sum + (p.quantityInMeters || 0), 0);
    const totalQuantityBoxes = products.reduce((sum, p) => sum + (p.quantityInBoxes || 0), 0);
    const totalItems = products.length;
    const lowStockItems = products.filter(p => p.isLowStock).length;

    res.json({
      statistics: {
        totalQuantityM2,
        totalQuantityBoxes,
        totalItems,
        lowStockItems
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product statistics', error: error.message });
  }
});

export default router; 