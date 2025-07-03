import express from 'express';
import Offer from '../models/Offer.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create offer
router.post('/', authenticate, async (req, res) => {
  try {
    
    // دعم حالتي string أو كائن
    const productId = typeof req.body.product === 'object' && req.body.product._id
      ? req.body.product._id
      : req.body.product;
    const product = await (await import('../models/Product.js')).default.findById(productId);
    if (!product) {
      return res.status(400).json({ message: 'Product not found' });
    }
    // تحقق من وجود عرض لنفس المنتج مسبقًا
    const existingOffer = await Offer.findOne({ product: product._id });
    if (existingOffer) {
      return res.status(400).json({ message: 'Offer for this product already exists.' });
    }
    // بناء بيانات العرض
    const offerData = {
      product: product._id,
      category: product.category,
      sku: product.sku,
      price: product.price,
      country: product.country,
      quantityInMeters: product.quantityInMeters,
      quantityInBoxes: product.quantityInBoxes,
      factory: product.factory,
      color: product.color,
      length: product.length,
      width: product.width,
      thickness: product.thickness,
      status: product.status,
      image: product.image,
      finishType: product.finishType,
      priceAfterDiscount: req.body.priceAfterDiscount,
      description: req.body.description || '',
    };
    const offer = new Offer(offerData);
    await offer.save();
    // تحديث المنتج المرتبط بالعرض
    await product.updateOne({
      hasOffer: true,
      offerPrice: req.body.priceAfterDiscount
    });
    res.status(201).json({ message: 'Offer created successfully', offer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create offer', error: error.message });
  }
});

// Get all offers
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [offers, count] = await Promise.all([
      Offer.find()
        .populate('product')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Offer.countDocuments()
    ]);
    res.json({ offers, count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch offers' });
  }
});

// Get offer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('product');
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.json({ offer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch offer' });
  }
});

// Update offer
router.put('/:id', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.json({ message: 'Offer updated successfully', offer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update offer' });
  }
});

// Delete offer
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    // إعادة حالة المنتج
    await (await import('../models/Product.js')).default.findByIdAndUpdate(offer.product, {
      hasOffer: false,
      offerPrice: null
    });
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete offer' });
  }
});

// Offer statistics for a warehouse
router.get('/warehouse/:warehouseId/statistics', authenticate, async (req, res) => {
  try {
    const { warehouseId } = req.params;
    // Find all offers for products in this warehouse
    const offers = await Offer.find().populate({
      path: 'product',
      match: { warehouse: warehouseId },
      select: 'warehouse category factory color country quantityInMeters quantityInBoxes',
    });
    // Filter offers that have a product belonging to this warehouse
    const filteredOffers = offers.filter(o => o.product && o.product.warehouse && o.product.warehouse.toString() === warehouseId);

    // Total number of offers
    const totalOffers = filteredOffers.length;
    // Total quantity in meters
    const totalQuantityMeters = filteredOffers.reduce((sum, o) => sum + (o.quantityInMeters || 0), 0);
    // Total quantity in boxes
    const totalQuantityBoxes = filteredOffers.reduce((sum, o) => sum + (o.quantityInBoxes || 0), 0);

    // Most frequent category
    const categoryCount = {};
    filteredOffers.forEach(o => {
      const category = o.category || (o.product && o.product.category) || 'غير محدد';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const mostFrequentCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Most frequent factory
    const factoryCount = {};
    filteredOffers.forEach(o => {
      const factory = o.factory || (o.product && o.product.factory) || 'غير محدد';
      factoryCount[factory] = (factoryCount[factory] || 0) + 1;
    });
    const mostFrequentFactory = Object.entries(factoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Most frequent color
    const colorCount = {};
    filteredOffers.forEach(o => {
      const color = o.color || (o.product && o.product.color) || 'غير محدد';
      colorCount[color] = (colorCount[color] || 0) + 1;
    });
    const mostFrequentColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Most frequent country
    const countryCount = {};
    filteredOffers.forEach(o => {
      const country = o.country || (o.product && o.product.country) || 'غير محدد';
      countryCount[country] = (countryCount[country] || 0) + 1;
    });
    const mostFrequentCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      statistics: {
        totalOffers,
        totalQuantityMeters,
        totalQuantityBoxes,
        mostFrequentCategory,
        mostFrequentFactory,
        mostFrequentColor,
        mostFrequentCountry
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch offer statistics', error: error.message });
  }
});

export default router; 