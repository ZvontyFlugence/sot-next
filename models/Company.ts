import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompany extends Document {
  _id: number,
  name: string,
  image: string,
  type: number,
  ceo: number,
  location: number,
  gold: number,
  funds: Array<Object>,
  inventory: Array<Object>,
  employees: Array<Object>,
  productOffers: Array<Object>,
  jobOffers: IJobOffer[],
  location_info?: {
    region_id: number,
    region_name: string,
    owner_id: number,
    owner_name: string,
    owner_flag: string,
  },
}

export interface IJobOffer {
  id?: string,
  title: string,
  quantity: number,
  wage: number,
}

const CompanySchema = new Schema({
  _id: Number,
  name: { type: String, required: true },
  image: { type: String, default: process.env.DEFAULT_IMG },
  type: { type: Number, required: true },
  ceo: { type: Number, required: true },
  location: { type: Number, required: true },
  gold: { type: Number, default: 10.00 },
  funds: { type: Array, default: [] },
  inventory: { type: Array, default: [] },
  employees: { type: Array, default: [] },
  productOffers: { type: Array, default: [] },
  jobOffers: { type: Array, default: [] },
});

let Company: Model<ICompany> | null;

try {
  Company = mongoose.model('Company');
} catch (e) {
  Company = mongoose.model<ICompany>('Company', CompanySchema, 'companies');
}

export default Company;