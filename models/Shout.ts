import mongoose, { Schema, Document, Model } from 'mongoose';


// Displayed in main thread is parent is -1
// Displayed as reply of parent otherwise
// Replies cannot have their own replies thread
// Scope ID of 0 => Global
// Otherwise scope_id corresponds to id of (country, party, military unit)
export interface IShout extends Document {
  _id?: number,
  parent?: number,
  scope: 'global' | 'country' | 'party' | 'unit',
  scope_id: number,
  author: number,
  message: string,
  replies?: IShout[],
  likes?: number[],
  timestamp?: Date,
}

const ShoutSchema = new Schema({
  _id: { type: Number },
  parent: { type: Number, default: -1 },
  scope: { type: String, required: true },
  scope_id: { type: Number, required: true },
  author: { type: Number, required: true },
  message: { type: String, required: true },
  likes: { type: Array, default: [] },
  timestamp: { type: Number, default: new Date(Date.now()) },
});

let Shout: Model<IShout> | null;
try {
  Shout = mongoose.model('Shout');
} catch (e) {
  Shout = mongoose.model('Shout', ShoutSchema, 'shouts');
}

export default Shout;