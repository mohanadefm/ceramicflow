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
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
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
      }
    }
  ],
  totalPrice: {
    type: Number,
    // required: true,
    min: 0
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
  if (this.products && Array.isArray(this.products)) {
    this.products.forEach(p => {
      if (p.quantity && p.unitPrice) {
        p.totalPrice = p.quantity * p.unitPrice;
      }
    });
    this.totalPrice = this.products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  } else {
    this.totalPrice = 0;
  }
  next();
});

// Pre-update middleware to calculate total price
orderSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.products && Array.isArray(update.products)) {
    update.products.forEach(p => {
      if (p.quantity && p.unitPrice) {
        p.totalPrice = p.quantity * p.unitPrice;
      }
    });
    update.totalPrice = update.products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  }
  next();
});

export default mongoose.model('Order', orderSchema); 