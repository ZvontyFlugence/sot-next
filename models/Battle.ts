import { ObjectId } from 'bson';
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBattle extends Document {
  _id?: ObjectId;
  war: ObjectId;
  attacker: number;
  defender: number;
  region: number;
  start: Date;
  end: Date;
  stats: IBattleStats;
  winner?: number;
}

// Potentially Add More Stats like # of hits, etc.
export interface IBattleStats {
  attackers: {
    [userId: number]: number;
  };
  defenders: {
    [userId: number]: number;
  };
  totalDamage: number;
  battleHero: number;
}

const BattleSchema = new Schema({
  _id: { type: ObjectId },
  war: { type: ObjectId, required: true },
  attacker: { type: Number, required: true },
  defender: { type: Number, required: true },
  region: { type: Number, required: true },
  start: { type: Date, default: new Date(Date.now()) },
  end: { type: Date, default: new Date(Date.now()).setUTCDate(new Date(Date.now()).getUTCDate() + 1) },
  stats: { type: Object, default: { attackers: {}, defenders: {}, totalDamage: 0, battleHero: -1 } },
  winner: { type: Number },
});

let Battle: Model<IBattle> | null;
try {
  Battle = mongoose.model('Battle');
} catch (e) {
  Battle = mongoose.model('Battle', BattleSchema, 'battles');
}

export default Battle;