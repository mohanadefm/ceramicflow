import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: '',
    unique: true
  },
  ordersNumber: {
    type: Number,
    default: 0
  },
  ordersCost: {
    type: Number,
    default: 0
  },
  lastOrder: {
    type: Date
  },
  phone: {
    type: String,
    trim: true,
    unique: true
  },
  photo: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Client', clientSchema); 