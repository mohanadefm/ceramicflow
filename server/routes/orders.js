import express from 'express';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';
import Product from '../models/Product.js';

const router = express.Router();

// Create order
router.post('/', authenticate, async (req, res) => {
  try {
    // توليد رقم الطلب الفريد
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, ''); // YYYYMMDD
    // جلب آخر طلب اليوم
    const lastOrder = await Order.findOne({ orderNumber: new RegExp(`^${dateStr}`) })
      .sort({ orderNumber: -1 });
    let serial = 1;
    if (lastOrder) {
      const lastSerial = parseInt(lastOrder.orderNumber.split('-')[1], 10);
      serial = lastSerial + 1;
    }
    const orderNumber = `${dateStr}-${serial.toString().padStart(4, '0')}`;

    // جلب المنتج
    const product = await Product.findById(req.body.product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // تحديد سعر الوحدة
    let unitPrice;
    if (req.body.unitPrice !== undefined) {
      unitPrice = req.body.unitPrice;
    } else if (product.hasOffer && product.offerPrice && product.offerPrice < product.price) {
      unitPrice = product.offerPrice;
    } else {
      unitPrice = product.price;
    }
    // إنشاء الطلب مع orderNumber والسعر الصحيح
    const order = new Order({
      ...req.body,
      orderNumber,
      unitPrice,
      totalPrice: unitPrice * req.body.quantity
    });
    await order.save();
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Get all orders with pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('customer', 'name email phone photo')
      .populate('product', 'name sku image category hasOffer offerPrice items_per_box length width price')
      .populate('warehouse', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const count = await Order.countDocuments();

    res.json({ 
      orders, 
      count,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get orders by warehouse
router.get('/warehouse/:warehouseId', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ warehouse: req.params.warehouseId })
      .populate('customer', 'name email phone photo')
      .populate('product', 'name sku image category hasOffer offerPrice items_per_box length width price')
      .populate('warehouse', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const count = await Order.countDocuments({ warehouse: req.params.warehouseId });

    res.json({ 
      orders, 
      count,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get orders by customer
router.get('/customer/:customerId', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.params.customerId })
      .populate('customer', 'name email phone photo')
      .populate('product', 'name sku image category hasOffer offerPrice items_per_box length width price')
      .populate('warehouse', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const count = await Order.countDocuments({ customer: req.params.customerId });

    res.json({ 
      orders, 
      count,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone photo')
      .populate('product', 'name sku image category hasOffer offerPrice items_per_box length width price')
      .populate('warehouse', 'name');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

// Update order
router.put('/:id', authenticate, async (req, res) => {
  try {
    // اجلب الطلب القديم للتحقق من الحالة السابقة
    const oldOrder = await Order.findById(req.params.id);
    const wasConfirmed = oldOrder && oldOrder.status === 'confirmed';
    // حدث الطلب
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('customer', 'name email phone photo')
     .populate('product', 'name sku image category hasOffer offerPrice items_per_box length width price')
     .populate('warehouse', 'name');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // إذا تم تغيير الحالة إلى confirmed ولم يكن الطلب مؤكداً سابقاً
    if (order.status === 'confirmed' && !wasConfirmed) {
      const productId = order.product._id || order.product;
      const product = await Product.findById(productId);
      if (product) {
        if (typeof product.quantityInBoxes === 'number') {
          if (product.quantityInBoxes < order.quantity) {
            return res.status(400).json({
              message: 'Insufficient boxes in product',
              error: req.headers['accept-language'] === 'ar' ?
                `الكمية المطلوبة (${order.quantity}) أكبر من عدد الصناديق المتوفرة (${product.quantityInBoxes}) في المنتج.` :
                `Requested quantity (${order.quantity}) exceeds available boxes (${product.quantityInBoxes}) in the product.`
            });
          }
          product.quantityInBoxes = product.quantityInBoxes - order.quantity;
        }
        // خصم الكمية بالمتر المربع
        if (
          typeof product.items_per_box === 'number' &&
          typeof product.length === 'number' &&
          typeof product.width === 'number' &&
          typeof product.quantityInMeters === 'number'
        ) {
          const totalArea = order.quantity * product.items_per_box * product.length * product.width / 10000;
          product.quantityInMeters = Math.max(0, product.quantityInMeters - totalArea);
        }
        await product.save();
      }
    }

    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

// Delete order
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
});

// Get order statistics
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    const paidOrders = await Order.countDocuments({ payment: 'paid' });
    const pendingPayment = await Order.countDocuments({ payment: 'pending' });

    res.json({
      totalOrders,
      statusBreakdown: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      paymentBreakdown: {
        paid: paidOrders,
        pending: pendingPayment
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order statistics', error: error.message });
  }
});

// Order statistics for a warehouse
router.get('/warehouse/:warehouseId/statistics', authenticate, async (req, res) => {
  try {
    const { warehouseId } = req.params;
    // اجلب كل الطلبات لهذا المستودع
    const orders = await Order.find({ warehouse: warehouseId })
      .populate('product', 'category type color country')
      .populate('customer', 'name country');

    // فلترة الطلبات المؤكدة أو المسلمة أو المشحونة
    const confirmedOrders = orders.filter(o => ['confirmed', 'delivered', 'shipped'].includes(o.status));

    const totalOrders = confirmedOrders.length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const avgOrderPrice = totalOrders > 0 ? confirmedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) / totalOrders : 0;
    const avgOrderQuantity = totalOrders > 0 ? confirmedOrders.reduce((sum, o) => sum + (o.quantity || 0), 0) / totalOrders : 0;

    // أكثر أنواع المنتجات طلبًا (حسب مجموع الكمية)
    const categoryQuantity = {};
    confirmedOrders.forEach(o => {
      const category = o.product?.category || 'غير محدد';
      categoryQuantity[category] = (categoryQuantity[category] || 0) + (o.quantity || 0);
    });
    const mostOrderedType = Object.entries(categoryQuantity).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // أكثر 3 دول طلبًا (من العميل، وإذا لم توجد من المنتج)
    const countryCount = {};
    confirmedOrders.forEach(o => {
      const country = o.customer?.country || o.product?.country || 'غير محدد';
      countryCount[country] = (countryCount[country] || 0) + 1;
    });
    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country, count]) => ({ country, count }));

    // أكثر 3 ألوان طلبًا
    const colorCount = {};
    confirmedOrders.forEach(o => {
      const color = o.product?.color || 'غير محدد';
      colorCount[color] = (colorCount[color] || 0) + 1;
    });
    const topColors = Object.entries(colorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color, count]) => ({ color, count }));

    // أكثر العملاء طلبًا
    const customerCount = {};
    confirmedOrders.forEach(o => {
      const name = o.customer?.name || 'غير محدد';
      customerCount[name] = (customerCount[name] || 0) + 1;
    });
    const topCustomers = Object.entries(customerCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    res.json({
      statistics: {
        totalOrders,
        totalSales,
        cancelledOrders,
        mostOrderedType,
        topCountries,
        topColors,
        topCustomers,
        avgOrderPrice,
        avgOrderQuantity
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order statistics', error: error.message });
  }
});

export default router; 