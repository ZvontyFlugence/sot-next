import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewspaper extends Document {
  _id: number,
  name: string,
  image: string,
  author: number,
  articles: IArticle[],
  subscribers: number[],
}

export interface IArticle {
  id: string,
  title: string,
  likes: number[],
  text: string,
  publishDate: Date,
  published: boolean,
  newspaper?: number,
}

const NewspaperSchema = new Schema({
  _id: Number,
  name: { type: String, required: true },
  image: { type: String, default: process.env.DEFAULT_IMG },
  author: { type: Number, required: true },
  articles: { type: Array, default: [] },
  subscribers: { type: Array, default: [] },
});

let Newspaper: Model<INewspaper> | null;

try {
  Newspaper = mongoose.model('Newspaper');
} catch (e) {
  Newspaper = mongoose.model<INewspaper>('Newspaper', NewspaperSchema, 'newspapers');
}

export default Newspaper;