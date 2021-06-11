import { connectToDB } from '@/util/mongo';
import User, { IUser } from '@/models/User';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { NextApiRequest, NextApiResponse } from 'next';
import { validateToken } from '@/util/auth';
import * as emailValidator from 'deep-email-validator';
import { OutputFormat } from 'deep-email-validator/dist/output/output';

interface IGetUserResponse {
  status_code: number,
  payload: {
    users?: IUser[],
    error?: string,
  },
}

interface IPostUserResponse {
  status_code: number,
  payload: {
    success?: boolean,
    error?: string,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      let validation_res = await validateToken(req, res);
      if (validation_res.error) {
        return res.status(401).json({ error: validation_res.error });
      }
      
      let result = await get();
      return res.status(result.status_code).json(result.payload);
    }
    case 'POST': {
      let result = await post(req);
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Request' });
  }
}

async function get() {
  let result: IGetUserResponse = {
    status_code: 500,
    payload: { users: undefined, error: 'Something Went Wrong!' }
  };

  await connectToDB();
  let users: IUser[] = await User.find({}).exec();
  if (users) {
    result.status_code = 200;
    result.payload = { users };
  }

  return result;
}

async function post(req) {
  let result: IPostUserResponse = {
    status_code: 200,
    payload: { success: true },
  };



  // Get form inputs
  const { email, password, username, country, ip } = JSON.parse(req.body);

  // Ensure db connection is established
  await connectToDB();

  // Make sure ip isn't already used
  let sameIpAccounts: IUser[] = await User.find({}).where({ ipAddrs: { $in: [ip] } }).exec();
  if (sameIpAccounts.length > 0) {
    result.status_code = 403;
    result.payload = { success: false, error: 'Possible Multiple Accounts Attempt Detected' };
    return result;
  }

  // Deep Email Validation to ensure real accounts only
  const { valid } = await isEmailValid(email);
  if (!valid) {
    result.status_code = 400;
    result.payload = { success: false, error: 'Invalid/Non-Existant Email Address' };
    return result;
  }

  // Make sure email account doesn't already exist
  let exists: IUser = await User.findOne({ email }).exec();
  if (exists) {
    result.status_code = 400;
    result.payload = { success: false, error: 'Email Already In Use!' };
    return result;
  }

  // Make sure username isnt already in use
  exists = await User.findOne({ username }).exec();
  if (exists) {
    result.status_code = 400;
    result.payload = { success: false, error: 'Username Is Taken!' };
    return result;
  }

  // Hash password
  let hashed_pw = await bcrypt.hash(password, await bcrypt.genSalt());

  // Get info on selected country
  let target_country: ICountry = await Country.findOne({ _id: country }).exec();
  if (!target_country) {
    result.status_code = 400;
    result.payload = { success: false, error: 'Invalid Country!' };
    return result;
  }

  // Select random starting region
  let region_list: IRegion[] = await Region.find({ owner: country }).exec();

  // Fallback for wiped countries
  if (!region_list || region_list.length === 0) {
    region_list = await Region.find({ core: country }).exec();
  }

  const index = Math.floor(Math.random() * region_list.length);
  let region: IRegion = region_list[index];

  // Save document
  let doc_count = await User.estimatedDocumentCount() + 1;
  let new_user: IUser = new User({
    _id: doc_count,
    email,
    username,
    password: hashed_pw,
    country,
    location: region._id,
    wallet: [{ currency: target_country.currency, amount: 25.00 }],
  });

  new_user.save();
  return result;
}

async function isEmailValid(email: string): Promise<OutputFormat> {
  return emailValidator.validate(email);
}