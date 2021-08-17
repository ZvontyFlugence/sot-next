import mongoose, { ConnectOptions } from 'mongoose';

const { MONGO_URI } = process.env;

const opts: ConnectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

export async function connectToDB() {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(MONGO_URI, opts);
}