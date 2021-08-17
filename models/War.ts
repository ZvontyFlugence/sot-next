import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWar extends Document {
  _id?: mongoose.Types.ObjectId;
  source: number;
  target: number;
  sourceAllies: number[];
  targetAllies: number[];
  battles: mongoose.Types.ObjectId[];
}

const WarSchema = new Schema({
  _id: { type: mongoose.Types.ObjectId, default: new mongoose.Types.ObjectId() },
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