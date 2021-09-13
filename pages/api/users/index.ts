import { connectToDB } from '@/util/mongo';
import User, { IUser } from '@/models/User';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from 'next';
import { validateToken } from '@/util/auth';
import EmailValidator from 'email-deep-validator';
import { ActionResult, defaultActionResult } from '@/util/apiHelpers';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Ensure db connection is established
  await connectToDB();

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
  let ret: ActionResult = defaultActionResult();

  try {
    let users: IUser[] = await User.find({}).exec();
    if (!users)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, users };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function post(req) {
  let ret: ActionResult = defaultActionResult();

  try {
    // Get form inputs
    const { email, password, username, country, ip } = JSON.parse(req.body);

    // Make sure ip isn't already used
    let sameIpAccounts: IUser[] = await User.find({}).where({ ipAddrs: { $in: [ip] } }).exec();
    if (sameIpAccounts.length > 0) {
      ret.status_code = 403;
      ret.payload.error = 'Possible Multiple Accounts Attempt Detected';
      throw new Error(ret.payload.error);
    }

    // Deep Email Validation to ensure real accounts only
    const valid = await isEmailValid(email);
    if (!valid) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid/Non-Existant Email Address';
      throw new Error(ret.payload.error);
    }

    // Make sure email account doesn't already exist
    let exists: IUser = await User.findOne({ email }).exec();
    if (exists) {
      ret.status_code = 400;
      ret.payload.error = 'Email Already In Use!';
      throw new Error(ret.payload.error);
    }

    // Make sure username isnt already in use
    exists = await User.findOne({ username }).exec();
    if (exists) {
      ret.status_code = 400;
      ret.payload.error = 'Username Is Taken!';
      throw new Error(ret.payload.error);
    }

    // Hash password
    let hashed_pw = await bcrypt.hash(password, await bcrypt.genSalt());

    // Get info on selected country
    let target_country: ICountry = await Country.findOne({ _id: country }).exec();
    if (!target_country) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Country!';
      throw new Error(ret.payload.error);
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
      residence: region._id,
      wallet: [{ currency: target_country.currency, amount: 25.00 }],
      patriotDmg: { [country]: 0 },
    });

    let saved = await new_user.save();
    if (!saved)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Account Created' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function isEmailValid(email: string): Promise<boolean> {
  const emailValidator = new EmailValidator();
  let results = await emailValidator.verify(email);
  return results.wellFormed && results.validDomain && results.validMailbox !== false;
}