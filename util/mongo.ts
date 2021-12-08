import mongoose from 'mongoose';

const { MONGO_URI } = process.env;

export async function connectToDB() {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(MONGO_URI);
}