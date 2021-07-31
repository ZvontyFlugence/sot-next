import { LawType } from '@/util/apiHelpers';
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICountry extends Document {
  _id: number;
  name: string;
  nick: string;
  flag_code: string;
  currency: string;
  color: string;
  exchangeOffers: Array<Object>;
  capital: number;
  government: IGovernment;
  treasury: ITreasury;
  policies: {
    allies: IAlly[];
    governmentType: GovernmentType;
    embargos: IEmbargo[];
    minWage: number;
    taxes: {
      import: number;
      income: number;
      vat: number;
    };
    welcomeMessage: string;
  };
  pendingLaws: ILaw[];
  pastLaws: ILaw[];
}

export interface ITreasury {
  [currency: string]: number;
}

export interface IGovernment {
  president?: number;
  vp?: number;
  cabinet: ICabinet;
  congress: ICongressMember[];
  electionSystem: ElectionSystem;
  totalElectoralVotes?: number;
}

export enum GovernmentType {
  DEMOCRACY = 'democracy',
  DICTATORSHIP = 'dictatorship', // Only CP - No VP/Cabinet/Congress - No CP or Congress Elections
  OLIGARCHY = 'oligarchy', // Only Congress - No CP/VP/Cabinet - No CP or Congress Elections
}

export interface IEmbargo {
  country: number;
  expires?: Date;
}

export interface IAlly {
  country: number;
  expires?: Date;
}

export interface IImpeachCP {}

export interface ISetMinWage {
  wage: number;
}

export interface IPrintMoney {
  amount: number;
}

export interface IChangeIncomeTax {
  percentage: number;
}

export interface IChangeImportTax {
  [productId: number]: number;
}

export interface IChangeVATTax {
  [productId: number]: number;
}

export interface IDeclareWar {
  country: number;
}

export interface IPeaceTreaty {
  country: number;
}

export interface ILaw {
  id: string;
  type: LawType;
  details: (
    IChangeIncomeTax | IChangeImportTax | IChangeVATTax | IEmbargo | IAlly | IImpeachCP |
    ISetMinWage | IPrintMoney | IDeclareWar | IPeaceTreaty
  );
  proposed: Date;
  proposedBy: number;
  expires: Date;
  votes: ILawVote[];
  passed?: boolean;
}

export interface ILawVote {
  id: number;
  choice: 'yes' | 'no' | 'abstain';
}

export interface ICabinet {
  mofa?: number;
  mod?: number;
  mot?: number;
}

export interface ICongressMember {
  id: number;
  location: number;
}

export enum ElectionSystem {
  PopularVote = 'Popular Vote',
  ElectoralCollege = 'Electoral College',
}

export interface ICountryStats {
  _id?: number;
  name?: string;
  flag_code?: string;
  population?: number;
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
  treasury: { type: Object, required: true },
  policies: { type: Object, required: true },
  pendingLaws: { type: Array, default: [] },
  pastLaws: { type: Array, default: [] },
}, { _id: false });

let Country: Model<ICountry> | null;

try {
  Country = mongoose.model('Country');
} catch (e) {
  Country = mongoose.model<ICountry>('Country', CountrySchema, 'countries');
}

export default Country;