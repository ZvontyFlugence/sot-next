import Company, { ICompany } from "@/models/Company";
import User, { IUser, IUserUpdates } from "@/models/User";
import { ActionResult, defaultActionResult } from "@/util/apiHelpers";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";
import { IMap } from "./doAction";

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
      let result: ActionResult = await get();
      return res.status(result.status_code).json(result.payload);
    }
    case 'POST': {
      const { user_id } = validation_res;
      let result: ActionResult = await post(user_id, JSON.parse(req.body));
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

// Return array of all companies
async function get(): Promise<ActionResult> {
  // Ensure db connection is established
  await connectToDB();

  // Fetch companies
  let companies: ICompany[] = await Company.find({}).exec();
  return { status_code: 200, payload: { success: true, companies } };
}

// Create a new company
async function post(user_id: number, data: ICreateCompanyReq): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  
  // Ensure db connection is established
  await connectToDB();

  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      let user: IUser = await User.findOne({ _id: user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      } else if (user.gold < 25) {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Funds';
        throw new Error(ret.payload.error);
      } else if (data.type === 0 || typeof data.type !== 'number') {
        ret.status_code = 400;
        ret.payload.error = 'Invalid Company Type';
        throw new Error(ret.payload.error);
      }

      const { name, type } = data;

      let doc_count: number = await Company.estimatedDocumentCount() + 1;
      let new_comp: ICompany = new Company({
        _id: doc_count,
        name,
        type,
        ceo: user._id,
        location: user.location,
      });

      new_comp.$session(session);
      let createdComp: ICompany = await new_comp.save();
      if (!createdComp) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let updates: IMap = { $inc: { gold: -25 } };
      let updated: IUser = await user.updateOne(updates);
      if (!updated) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Company Created', company_id: createdComp };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}