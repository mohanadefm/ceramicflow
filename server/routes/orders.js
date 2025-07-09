import express from 'express';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';
import Product from '../models/Product.js';

const router = express.Router();

// Create order
router.post('/', authenticate, async (req, res) => {
  try {
    // توليد جزء التاريخ
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, ''); // YYYYMMDD
    // جلب آخر طلب لنفس المستودع في نفس اليوم
    const lastOrder = await Order.findOne({
      warehouse: req.body.warehouse,
      orderNumber: { $regex: `^${dateStr}-` }
    }).sort({ orderNumber: -1 });
    let serial = 1;
    if (lastOrder) {
      const lastSerial = parseInt(lastOrder.orderNumber.split('-')[1], 10);
      if (!isNaN(lastSerial)) {
        serial = lastSerial + 1;
      }
    }
    // توليد orderNumber الجديد: تاريخ اليوم + تسلسل خاص
    const orderNumber = `${dateStr}-${serial.toString().padStart(4, '0')}`;

    // معالجة المنتجات
    if (!Array.isArray(req.body.products) || req.body.products.length === 0) {
      return res.status(400).json({ message: 'Products array is required' });
    }
    const products = [];
    for (const item of req.body.products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }
      // تحديد سعر الوحدة
      let unitPrice;
      if (item.unitPrice !== undefined) {
        unitPrice = item.unitPrice;
      } else if (product.hasOffer && product.offerPrice && product.offerPrice < product.price) {
        unitPrice = product.offerPrice;
      } else {
        unitPrice = product.price;
      }
      products.push({
        product: item.product,
        quantity: item.quantity,
        sku: item.sku || product.sku,
        unitPrice,
        totalPrice: unitPrice * item.quantity
      });
    }
    // إنشاء الطلب
    const { totalPrice, ...rest } = req.body;
    const order = new Order({
      ...rest,
      orderNumber,
      products
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

    // دعم البحث الجزئي برقم الطلب
    let filter = { warehouse: req.user._id };
    if (req.query.orderNumber) {
      filter.orderNumber = { $regex: req.query.orderNumber, $options: 'i' };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone photo')
      .populate('products.product', 'name sku image category hasOffer offerPrice items_per_box length width price')
      .populate('warehouse', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const count = await Order.countDocuments(filter);

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
      .populate('products.product', 'name sku image category hasOffer offerPrice items_per_box length width price')
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
      .populate('products.product', 'name sku image category hasOffer offerPrice items_per_box length width price')
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
      .populate('products.product', 'name sku image category hasOffer offerPrice items_per_box length width price')
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
    if (!oldOrder) return res.status(404).json({ message: 'Order not found' });
    const wasConfirmed = oldOrder.status === 'confirmed';

    // تحقق من الكمية قبل تحديث الطلب إذا كان سيتم تأكيد الطلب الآن ولم يكن مؤكداً سابقاً
    if (req.body.status === 'confirmed' && !wasConfirmed) {
      const productsToCheck = req.body.products || oldOrder.products;
      for (const item of productsToCheck) {
        const product = await Product.findById(item.product);
        if (product) {
          if (typeof product.quantityInBoxes === 'number') {
            if (product.quantityInBoxes < item.quantity) {
              return res.status(400).json({
                message: 'Insufficient boxes in product',
                error: req.headers['accept-language'] === 'ar' ?
                  `الكمية المطلوبة (${item.quantity}) أكبر من عدد الصناديق المتوفرة (${product.quantityInBoxes}) في المنتج.` :
                  `Requested quantity (${item.quantity}) exceeds available boxes (${product.quantityInBoxes}) in the product.`
              });
            }
          }
        }
      }
    }

    // إعادة حساب totalPrice إذا تم تحديث المنتجات
    if (req.body.products && Array.isArray(req.body.products)) {
      req.body.products.forEach(p => {
        if (p.quantity && p.unitPrice) {
          p.totalPrice = p.quantity * p.unitPrice;
        }
      });
      req.body.totalPrice = req.body.products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    }

    // الآن حدث الطلب بعد التحقق
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customer', 'name email phone photo')
     .populate('warehouse', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // إذا تم تغيير الحالة إلى confirmed ولم يكن الطلب مؤكداً سابقاً
    if (order.status === 'confirmed' && !wasConfirmed) {
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          if (typeof product.quantityInBoxes === 'number') {
            product.quantityInBoxes = product.quantityInBoxes - item.quantity;
          }
          // خصم الكمية بالمتر المربع
          if (
            typeof product.items_per_box === 'number' &&
            typeof product.length === 'number' &&
            typeof product.width === 'number' &&
            typeof product.quantityInMeters === 'number'
          ) {
            const totalArea = item.quantity * product.items_per_box * product.length * product.width / 10000;
            product.quantityInMeters = Math.max(0, product.quantityInMeters - totalArea);
          }
          await product.save();
        }
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
      .populate('products.product', 'category type color country')
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
      o.products.forEach(item => {
        const category = item.product?.category || 'غير محدد';
        categoryQuantity[category] = (categoryQuantity[category] || 0) + (item.quantity || 0);
      });
    });
    const mostOrderedType = Object.entries(categoryQuantity).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // أكثر 3 دول طلبًا (من العميل، وإذا لم توجد من المنتج)
    const countryCount = {};
    confirmedOrders.forEach(o => {
      if (o.customer?.country) {
        countryCount[o.customer.country] = (countryCount[o.customer.country] || 0) + 1;
      } else {
        o.products.forEach(item => {
          const country = item.product?.country || 'غير محدد';
          countryCount[country] = (countryCount[country] || 0) + 1;
        });
      }
    });
    const topCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country, count]) => ({ country, count }));

    // أكثر 3 ألوان طلبًا
    const colorCount = {};
    confirmedOrders.forEach(o => {
      o.products.forEach(item => {
        const color = item.product?.color || 'غير محدد';
        colorCount[color] = (colorCount[color] || 0) + 1;
      });
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