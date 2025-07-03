import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Client from '../models/Client.js';
import { authenticate } from '../middleware/auth.js';
import Order from '../models/Order.js';

const router = express.Router();

// إعداد التخزين للعملاء
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'server', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'client-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Create client
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    // تحقق من التكرار
    const existingClient = await Client.findOne({
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });
    if (existingClient) {
      return res.status(400).json({ message: 'Email or phone number already exists.' });
    }
    const clientData = {
      ...req.body,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      address: req.body.address || '',
      notes: req.body.notes || ''
    };
    const client = new Client(clientData);
    await client.save();
    res.status(201).json({ message: 'Client created successfully', client });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create client', error: error.message });
  }
});

// Get all clients
router.get('/', authenticate, async (req, res) => {
  try {
    const { sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // بناء شرط البحث
    let matchQuery = {};
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchQuery = {
        $or: [
          { name: searchRegex },
          { phone: searchRegex },
          { email: searchRegex }
        ]
      };
    }

    // جلب العملاء مع الفلترة
    const clientsAgg = await Client.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'orders',
          let: { clientId: '$_id' },
          pipeline: [
            { $match: {
                $expr: { $eq: ['$customer', '$$clientId'] },
                status: 'confirmed'
              }
            }
          ],
          as: 'filteredOrders',
        },
      },
      {
        $addFields: {
          ordersCount: { $size: '$filteredOrders' },
          totalOrders: { $sum: '$filteredOrders.totalPrice' },
          lastOrderDate: { $max: '$filteredOrders.createdAt' },
        },
      },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          filteredOrders: 0, // لا نعيد تفاصيل الطلبات
        },
      },
    ]);
    // للحصول على العدد الكلي بعد الفلترة
    const count = await Client.countDocuments(matchQuery);
    res.json({
      clients: clientsAgg,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch clients', error: error.message });
  }
});

// Get client by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('user');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ client });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch client' });
  }
});

// Update client
router.put('/:id', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
      
      // حذف الصورة القديمة إذا كانت موجودة
      const existingClient = await Client.findById(req.params.id);
      if (existingClient && existingClient.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'server', existingClient.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
    }
    
    if (typeof req.body.address !== 'undefined') updateData.address = req.body.address;
    if (typeof req.body.notes !== 'undefined') updateData.notes = req.body.notes;
    
    const client = await Client.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('user');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client updated successfully', client });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    // حذف الصورة إذا كانت موجودة
    if (client.photo) {
      const photoPath = path.join(process.cwd(), 'server', client.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete client' });
  }
});

// Client statistics for a warehouse
router.get('/warehouse/:warehouseId/statistics', authenticate, async (req, res) => {
  try {
    const { warehouseId } = req.params;
    // Get all confirmed orders for this warehouse
    const orders = await Order.find({ warehouse: warehouseId, status: { $in: ['confirmed', 'delivered', 'shipped'] } })
      .populate('customer', 'name email phone photo');

    // Unique clients
    const clientMap = new Map();
    orders.forEach(order => {
      if (order.customer && order.customer._id) {
        clientMap.set(order.customer._id.toString(), order.customer);
      }
    });
    const totalClients = clientMap.size;

    // Count orders per client and total value per client
    const clientOrderStats = {};
    orders.forEach(order => {
      if (order.customer && order.customer._id) {
        const id = order.customer._id.toString();
        if (!clientOrderStats[id]) {
          clientOrderStats[id] = {
            client: order.customer,
            orderCount: 0,
            totalValue: 0
          };
        }
        clientOrderStats[id].orderCount += 1;
        clientOrderStats[id].totalValue += order.totalPrice || 0;
      }
    });
    // Top 5 clients by order count
    const topClientsByOrders = Object.values(clientOrderStats)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)
      .map(stat => ({
        client: stat.client,
        orderCount: stat.orderCount,
        totalValue: stat.totalValue
      }));
    // Top 5 clients by total order value
    const topClientsByValue = Object.values(clientOrderStats)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map(stat => ({
        client: stat.client,
        orderCount: stat.orderCount,
        totalValue: stat.totalValue
      }));
    // Total orders by all clients
    const totalOrdersByClients = orders.length;

    res.json({
      statistics: {
        totalClients,
        totalOrdersByClients,
        topClientsByOrders,
        topClientsByValue
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch client statistics', error: error.message });
  }
});

export default router; 