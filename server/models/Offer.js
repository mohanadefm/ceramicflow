import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceAfterDiscount: {
    type: Number,
    required: [true, 'Price after discount is required'],
    min: [0, 'Price after discount cannot be negative']
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
  }
}, {
  timestamps: true
});

export default mongoose.model('Offer', offerSchema); 