import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

export interface IElection extends Document {
  _id: ObjectId,
  type: ElectionType,
  country: number,
  candidates: ICandidate[],
  month: number,
  isActive: boolean,
  isCompleted: boolean,
  winner: number,
}

export enum ElectionType {
  CountryPresident = 'Country President',
  Congress = 'Congress',
  PartyPresident = 'Party President',
}

export interface ICandidate {
  id: number,
  image?: string,
  name?: string,
  party: number,
  partyName?: string,
  partyImage?: string,
  votes: number[] | ECVote[],
  location?: number,
  locationName?: string,
}

export interface ECVote {
  id: number,
  location: number,
}

const ElectionSchema = new Schema({
  _id: Schema.Types.ObjectId,
  type: { type: String, required: true },
  country: { type: Number, required: true },
  candidates: { type: Array, default: [] },
  month: { type: Number, default: new Date(Date.now()).getUTCMonth() },
  isActive: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  winner: { type: Number, default: -1 },
});

let Election: Model<IElection> | null;

try {
  Election = mongoose.model('Election');
} catch (e: any) {
  Election = mongoose.model<IElection>('Election', ElectionSchema, 'elections');
}

export default Election;