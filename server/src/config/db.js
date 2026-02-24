import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI environment variable is not set');

  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.host);
};

export default connectDB;
