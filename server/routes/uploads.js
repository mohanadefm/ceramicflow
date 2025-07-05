import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.Cloud_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'general-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({ storage: storage });

// مسار رفع الصور
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // رابط الصورة من Cloudinary
  const url = req.file.path;
  res.json({ url });
});

export default router; 