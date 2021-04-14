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
  government: Object,
  congressElections: Array<Object>,
  presidentElections: Array<Object>,
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
  congressElections: { type: Array, default: []},
  presidentElections: { type: Array, default: []},
}, { _id: false });

let Country: Model<ICountry> | null;

try {
  Country = mongoose.model('Country');
} catch (e) {
  Country = mongoose.model<ICountry>('Country', CountrySchema, 'countries');
}

export default Country;