import Company, { ICompany } from "@/models/Company";
import User, { IUser, IUserUpdates } from "@/models/User";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

interface ICreateCompanyReq {
  name: string,
  type: number,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate token
  let validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(400).json({ error: 'Invalid/Expired Token' });
  }
  
  switch (req.method) {
    case 'GET': {
      let result = await get();
      return res.status(result.status_code).json(result.payload);
    }
    case 'POST': {
      const { user_id } = validation_res;
      let result = await post(user_id, JSON.parse(req.body));
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

// Return array of all companies
async function get() {
  // Ensure db connection is established
  await connectToDB();
  // Fetch companies
  let companies: ICompany[] = await Company.find({}).exec();
  return { status_code: 200, payload: { companies } };
}

// Create a new company
async function post(user_id: number, data: ICreateCompanyReq) {
  // Ensure db connection is established
  await connectToDB();
  
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (user.gold < 25) {
    return { status_code: 400, payload: { error: 'Insufficient Funds' } };
  } else if (data.type === 0 || typeof data.type !== 'number') {
    return { status_code: 400, payload: { error: 'Invalid Company Type' } };
  }

  let doc_count = await Company.estimatedDocumentCount() + 1;
  let new_comp: ICompany = new Company({
    _id: doc_count,
    name: data.name,
    type: data.type,
    ceo: user._id,
    location: user.location,
  });

  await new_comp.save();

  let updates: IUserUpdates = {
    gold: user.gold - 25,
  };

  let updated: IUser = await user.updateOne({ $set: { ...updates } }).exec();

  if (updated) {
    return { status_code: 200, payload: { success: true, company_id: doc_count } }; 
  }

  return { status_code: 500, payload: { error: 'Something Went Wrong' } };
}