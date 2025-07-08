import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Customer is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Warehouse is required']
  },
  payment: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be non-negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price must be non-negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total price
orderSchema.pre('save', function(next) {
  if (this.quantity && this.unitPrice) {
    this.totalPrice = this.quantity * this.unitPrice;
  }
  next();
});

// Pre-update middleware to calculate total price
orderSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  // جلب الطلب القديم من قاعدة البيانات
  const docToUpdate = await this.model.findOne(this.getQuery());
  const quantity = update.quantity !== undefined ? update.quantity : docToUpdate.quantity;
  const unitPrice = update.unitPrice !== undefined ? update.unitPrice : docToUpdate.unitPrice;
  update.totalPrice = quantity * unitPrice;
  next();
});

export default mongoose.model('Order', orderSchema); 