import { ObjectId } from 'bson';
import mongoose, { Schema, Document, Model } from 'mongoose';

// TODO: Potentially allow battles to end before 24hr limit
// Essentially allows enacting 'Blitzkreig' tactics

export interface IBattle extends Document {
  _id?: ObjectId;
  war: ObjectId;
  attacker: number;
  defender: number;
  region: number;
  start: Date;
  end: Date;
  wall: number;
  stats: IBattleStats;
  winner?: number;
}

// Potentially Add More Stats like # of hits, etc.
export interface IBattleStats {
  attackers: {
    [userId: number]: {
      country: number;
      damage: number;
    };
  };
  defenders: {
    [userId: number]: {
      country: number;
      damage: number;
    };
  };
  recentHits: {
    attackers: { // Last 10 hits for attackers
      userId: number;
      country: number;
      damage: number;
    }[];
    defenders: { // Last 10 hits for defenders
      userId: number;
      country: number;
      damage: number;
    }[];
  };
  totalDamage: number;
  battleHeroes: {
    attacker: number;
    defender: number;
  };
}

const BattleSchema = new Schema({
  _id: { type: ObjectId, default: new ObjectId() },
  war: { type: ObjectId, required: true },
  attacker: { type: Number, required: true },
  defender: { type: Number, required: true },
  region: { type: Number, required: true },
  start: { type: Date, default: new Date(Date.now()) },
  end: { type: Date, default: new Date(Date.now()).setUTCDate(new Date(Date.now()).getUTCDate() + 1) },
  wall: { type: Number, required: true },
  stats: {
    type: Object,
    default: {
      attackers: {},
      defenders: {},
      recentHits: {
        attackers: [],
        defenders: [],
      },
      totalDamage: 0,
      battleHeroes: {
        attacker: -1,
        defender: -1,
      },
    },
  },
  winner: { type: Number },
});

let Battle: Model<IBattle> | null;
try {
  Battle = mongoose.model('Battle');
} catch (e) {
  Battle = mongoose.model('Battle', BattleSchema, 'battles');
}

export default Battle;