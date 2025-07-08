import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    // required: [true, 'Phone is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  address: {
    type: String,
    // required: [true, 'Address is required'],
    trim: true
  },
  commercialRecord: {
    type: String,
    // required: function() { return this.type === 'warehouse'; },
    trim: true
  },
  accountNumbers: [{
    type: String,
    // required: function() { return this.type === 'warehouse'; },
    trim: true
  }],
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['warehouse', 'exhibition']
  },
  taxNumber: {
    type: String,
    // required: [true, 'Tax Number is required'],
    trim: true
  },
  warehouseCode: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Index for better query performance
// userSchema.index({ email: 1 });
// userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model('User', userSchema);