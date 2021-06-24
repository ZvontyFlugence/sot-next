import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegion extends Document {
  _id: number,
  name: string,
  core: number,
  owner: number,
  resource: number,
  borders: IPath[] | IPath[][],
  neighbors: number[],
  type?: string,
  representatives: number[],
}

export interface IPath {
  lat: number,
  lng: number,
}

const RegionSchema = new Schema({
  _id: { type: Number },
  name: { type: String, required: true },
  core: { type: Number, required: true },
  owner: { type: Number, required: true },
  resource: { type: Number, required: true },
  borders: { type: Array },
  neighbors: { type: Array },
  type: { type: String },
}, { _id: false });

let Region: Model<IRegion> | null;
try {
  Region = mongoose.model('Region');
} catch (e) {
  Region = mongoose.model('Region', RegionSchema, 'regions');
}

export default Region;