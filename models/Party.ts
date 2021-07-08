import mongoose, { Schema, Document, Model } from 'mongoose';
import { ICandidate } from './Election';

export interface IParty extends Document {
  _id: number,
  name: string,
  image: string,
  economicStance: EconomicStance,
  socialStance: SocialStance,
  president: number,
  vp: number,
  members: number[],
  description: string,
  country: number,
  cpCandidates: ICandidate[],
  congressCandidates: ICandidate[],
  ppCandidates: ICandidate[],
  color: string,
}

export enum EconomicStance {
  ExtremeRight = 1.0, // Fascist
  FarRight = 0.75, // Reactionary
  Right = 0.5, // Convervative
  CenterRight = 0.25, // Neoconservative
  Center = 0, // Centrist
  CenterLeft = -0.25, // Liberal
  Left = -0.5, // Progressive
  FarLeft = -0.75, // Socialist
  ExtremeLeft = -1.0, // Communist
};

export namespace EconomicStance {
  export function valueOf(value: number): EconomicStance | null {
    switch (value) {
      case 1.0:
        return EconomicStance.ExtremeRight;
      case 0.75:
        return EconomicStance.FarRight;
      case 0.5:
        return EconomicStance.Right;
      case 0.25:
        return EconomicStance.CenterRight;
      case 0:
        return EconomicStance.Center;
      case -0.25:
        return EconomicStance.CenterLeft;
      case -0.5:
        return EconomicStance.Left;
      case -0.75:
        return EconomicStance.FarLeft;
      case -1.0:
        return EconomicStance.ExtremeLeft;
      default:
        return null;
    }
  }

  export function toString(stance: EconomicStance): string {
    switch (stance) {
      case EconomicStance.ExtremeRight:
        return 'Fascist';
      case EconomicStance.FarRight:
        return 'Reactionary';
      case EconomicStance.Right:
        return 'Conservative';
      case EconomicStance.CenterRight:
        return 'Neoconservative';
      case EconomicStance.Center:
        return 'Centrist';
      case EconomicStance.CenterLeft:
        return 'Liberal';
      case EconomicStance.Left:
        return 'Progressive';
      case EconomicStance.FarLeft:
        return 'Socialist';
      case EconomicStance.ExtremeLeft:
        return 'Communist';
    }
  }
}

export enum SocialStance {
  Authoritarian = 0.99,
  ModerateAuthoritarian = 0.66,
  LeanAuthoritarian = 0.33,
  Centrist = 0,
  LeanLibertarian = -0.33,
  ModerateLibertarian = -0.66,
  Libertarian = -0.99,
}

export namespace SocialStance {
  export function valueOf(value: number): SocialStance | null {
    switch (value) {
      case 0.99:
        return SocialStance.Authoritarian;
      case 0.66:
        return SocialStance.ModerateAuthoritarian;
      case 0.33:
        return SocialStance.LeanAuthoritarian;
      case 0:
        return SocialStance.Centrist;
      case -0.33:
        return SocialStance.LeanLibertarian;
      case -0.66:
        return SocialStance.ModerateLibertarian;
      case -0.99:
        return SocialStance.Libertarian;
      default:
        return null;
    }
  }
  
  export function toString(stance: SocialStance): string {
    switch (stance) {
      case SocialStance.Authoritarian:
        return 'Authoritarian';
      case SocialStance.ModerateAuthoritarian:
        return 'Moderate Authoritarian';
      case SocialStance.LeanAuthoritarian:
        return 'Authoritarian-leaning';
      case SocialStance.Centrist:
        return 'Centrist';
      case SocialStance.LeanLibertarian:
        return 'Libertarian-leaning';
      case SocialStance.ModerateLibertarian:
        return 'Moderate Libertarian';
      case SocialStance.Libertarian:
        return 'Libertarian';
    }
  }
}

const PartySchema = new Schema({
  _id: Number,
  name: { type: String, required: true },
  image: { type: String, default: process.env.DEFAULT_IMG },
  economicStance: { type: Number, required: true },
  socialStance: { type: Number, required: true },
  members: { type: Array, required: true },
  country: { type: Number, required: true },
  president: { type: Number, required: true },
  vp: { type: Number, default: -1 },
  description: { type: String, default: '' },
  cpCandidates: { type: Array, default: [] },
  congressCandidates: { type: Array, default: [] },
  ppCandidates: { type: Array, default: [] },
  color: { type: String, required: true },
});

let Party: Model<IParty> | null;

try {
  Party = mongoose.model('Party');
} catch (e: any) {
  Party = mongoose.model<IParty>('Party', PartySchema, 'parties');
}

export default Party;