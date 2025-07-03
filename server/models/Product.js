import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Warehouse is required']
  },
  category: {
    type: String,
    enum: ['ceramic', 'porcelain', 'stone', 'marble'],
    required: [true, 'Category is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  quantityInMeters: {
    type: Number,
    required: [true, 'Quantity in meters is required'],
    min: [0, 'Quantity cannot be negative']
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  factory: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  length: {
    type: Number,
    min: [0, 'Length cannot be negative']
  },
  width: {
    type: Number,
    min: [0, 'Width cannot be negative']
  },
  thickness: {
    type: Number,
    min: [0, 'Thickness cannot be negative']
  },
  quantityInBoxes: {
    type: Number,
    min: [0, 'Quantity in boxes cannot be negative']
  },
  status: {
    type: String,
    trim: true
  },
  finishType: {
    type: String,
    enum: ['matte', 'glossy', 'semi-gloss', 'polished'],
    required: [true, 'Finish type is required'],
    trim: true
  },
  items_per_box: {
    type: Number,
    required: [true, 'Items per box is required'],
    min: [1, 'Items per box must be at least 1'],
  },
  hasOffer: {
    type: Boolean,
    default: false
  },
  offerPrice: {
    type: Number,
    default: null
  },
}, {
  timestamps: true
});

// Compound indexes for better query performance
productSchema.index({ warehouse: 1, quantityInMeters: 1 });
productSchema.index({ warehouse: 1, quantityInBoxes: 1 });

// Compound index for uniqueness constraint
productSchema.index({ warehouse: 1, sku: 1 }, { unique: true });

// Virtual for low stock check
productSchema.virtual('isLowStock').get(function() {
  return this.quantityInMeters < 201 ;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema); 