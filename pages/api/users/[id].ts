import User, { IUser } from "@/models/User";
import { ActionResult, defaultActionResult } from "@/util/apiHelpers";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(401).json({ error: validation_res.error });
  }
  switch (req.method) {
    case 'GET': {
      // Ensure DB Conn
      await connectToDB();

      const { id } = req.query;
      let user_id: number;
      let result: ActionResult;
      
      try {
        user_id = Number.parseInt(id as string);
        result = await getUser(user_id);
      } catch (_e) {
        result = { status_code: 500, payload: { success: false, error: 'Something Went Wrong!' } };
      }

      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ success: false, error: 'Unhandled HTTP Method' });
  }
}

async function getUser(_id: number): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  
  try {
    let user: IUser = await User.findOne({ _id }).exec();
    
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    }

    // Hide User Password From Payload
    delete user.password;

    ret.status_code = 200;
    ret.payload = { success: true, user };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}