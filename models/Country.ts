import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICountry extends Document {
  _id: number,
  name: string,
  nick: string,
  flag_code: string,
  currency: string,
  color: string,
  exchangeOffers: Array<Object>,
  capital: number,
  government: IGovernment,
}

export interface IGovernment {
  president?: number,
  vp?: number,
  cabinet: ICabinet,
  congress: ICongressMember[],
  electionSystem: ElectionSystem,
  totalElectoralVotes?: number,
}

export interface ICabinet {
  mofa?: number,
  mod?: number,
  mot?: number,
}

export interface ICongressMember {
  id: number,
  location: number,
}

export enum ElectionSystem {
  PopularVote = 'Popular Vote',
  ElectoralCollege = 'Electoral College',
}

export interface ICountryStats {
  _id?: number,
  name?: string,
  flag_code?: string,
  population?: number,
}

const CountrySchema = new Schema({
  _id: Number,
  name: { type: String, required: true },
  nick: { type: String, required: true },
  flag_code: { type: String, required: true },
  currency: { type: String, required: true },
  color: { type: String, required: true },
  exchangeOffers: { type: Array, default: []},
  capital: { type: Number, required: true },
  government: { type: Object, required: true },
}, { _id: false });

let Country: Model<ICountry> | null;

try {
  Country = mongoose.model('Country');
} catch (e) {
  Country = mongoose.model<ICountry>('Country', CountrySchema, 'countries');
}

export default Country;