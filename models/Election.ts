import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';
import { ElectionSystem } from './Country';

export interface IElection extends Document {
  _id: ObjectId,
  type: ElectionType,
  typeId: number,
  candidates: ICandidate[],
  month: number,
  year: number,
  isActive: boolean,
  isCompleted: boolean,
  winner: number | number[],
  system?: ElectionSystem,
  tally?: { [candidate: number]: number },
  ecResults?: IVoteObject,
  regionTallies?: { [region: number]: number },
}

export interface IVoteObject {
  [region: number]: {
    [candidate: number]: number,
  },
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
  partyColor?: string,
  votes: number[] | ECVote[],
  location?: number,
  locationName?: string,
  xp?: number,
}

export interface ECVote {
  tally: number[],
  location: number,
}

const ElectionSchema = new Schema({
  _id: Schema.Types.ObjectId,
  type: { type: String, required: true },
  typeId: { type: Number, required: true },
  candidates: { type: Array, default: [] },
  month: { type: Number, default: new Date(Date.now()).getUTCMonth() + 1 },
  year: { type: Number, default: new Date(Date.now()).getUTCFullYear() },
  isActive: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  winner: { type: Number, default: -1 },
  system: { type: String },
  tally: { type: Object },
  ecResults: { type: Object },
  regionTallies: { type: Object },
});

let Election: Model<IElection> | null;

try {
  Election = mongoose.model('Election');
} catch (e: any) {
  Election = mongoose.model<IElection>('Election', ElectionSchema, 'elections');
}

export default Election;