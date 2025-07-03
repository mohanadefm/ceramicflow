import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('يرجى إضافة متغير MONGODB_URI في ملف .env');
  process.exit(1);
}

async function removeIsLowStock() {
  await mongoose.connect(uri);
  const result = await mongoose.connection.db.collection('materials').updateMany({}, { $unset: { isLowStock: "" } });
  console.log(`Updated ${result.modifiedCount} documents.`);
  await mongoose.disconnect();
}

removeIsLowStock().catch(err => {
  console.error(err);
  process.exit(1);
}); 