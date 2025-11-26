import mongoose from 'mongoose';

export const connectDb = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interviewzwt';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
