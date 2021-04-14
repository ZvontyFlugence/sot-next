import mongoose, { Schema, Document, Model } from 'mongoose';

// TODO: create interfaces or wallet, inventory, alerts, & messages array type
export interface IUser extends Document {
  _id: number,
  email: string,
  username: string,
  password?: string,
  image: string,
  createdOn: Date,
  description: string,
  level: number,
  xp: number,
  health: number,
  country: number,
  gold: number,
  strength: number,
  location: number,
  job: number | null,
  party: number | null,
  unit: number | null,
  newspaper: number | null,
  canTrain: Date,
  canWork: Date,
  canCollectRewards: Date,
  canHeal: Date,
  wallet: Array<Object>,
  inventory: Array<Object>,
  alerts: Array<Object>,
  messages: Array<Object>,
  pendingFriends: Array<number>,
  friends: Array<number>,
}

export interface IUserStats {
  _id: number,
  username: string,
  image: string,
  country?: {
    _id: number,
    flag_code: string,
    name: string,
  },
  strength?: number,
  xp?: number,
}

export interface IUserUpdates {
  [key: string]: any
}

const UserSchema: Schema = new Schema({
  _id: Number,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  image: { type: String, default: process.env.DEFAULT_USER_IMG },
  createdOn: { type: Date, default: new Date(Date.now()) },
  description: { type: String, default: '' },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  health: { type: Number, default: 100 },
  country: { type: Number, required: true },
  gold: { type: Number, default: 5.00 },
  strength: { type: Number, default: 0 },
  location: { type: Number, required: true },
  job: { type: Number, default: 0 },
  party: { type: Number, default: 0 },
  unit: { type: Number, default: 0 },
  newspaper: { type: Number, default: 0 },
  canTrain: { type: Date, default: new Date(Date.now()) },
  canWork: { type: Date, default: new Date(Date.now())},
  canCollectRewards: { type: Date, default: new Date(Date.now())},
  canHeal: { type: Date, default: new Date(Date.now())},
  wallet: { type: Array, required: true },
  inventory: { type: Array, default: []},
  alerts: { type: Array, default: []},
  messages: { type: Array, default: []},
  pendingFriends: { type: Array, default: []},
  friends: { type: Array, default: []},
}, {_id: false });

let User: Model<IUser> | null;

try {
  User = mongoose.model('User');
} catch (e) {
  User = mongoose.model<IUser>('User', UserSchema, 'users');
}

export default User;