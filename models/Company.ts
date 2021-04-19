import { IItem } from '@/util/apiHelpers';
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompany extends Document {
  _id: number,
  name: string,
  image: string,
  type: number,
  ceo: number,
  location: number,
  gold: number,
  funds: IFunds,
  inventory: IItem[],
  employees: IEmployee[],
  productOffers: IProductOffer[],
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

export interface IProductOffer {
  id?: string,
  product_id: number,
  quantity: number,
  price: number,
}

export interface IEmployee {
  user_id: number,
  title: string,
  wage: number,
}

export interface IFunds {
  currency: string,
  amount: number,
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