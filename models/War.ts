import { ObjectId } from 'bson';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IBattle } from './Battle';

export interface IWar extends Document {
  _id?: ObjectId;
  source: number;
  target: number;
  sourceAllies: number[];
  targetAllies: number[];
  battles: IBattle[];
}

const WarSchema = new Schema({
  _id: { type: ObjectId },
  source: { type: Number, required: true },
  target: { type: Number, required: true },
  sourceAllies: { type: Array, default: [] },
  targetAllies: { type: Array, default: [] },
  battles: { type: Array, default: [] },
});

let War: Model<IWar> | null;
try {
  War = mongoose.model('War');
} catch (e) {
  War = mongoose.model('War', WarSchema, 'wars');
}

export default War;