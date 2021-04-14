import User, { IUser } from "@/models/User";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

interface IResult {
  status_code: number,
  payload: {
    user?: IUser,
    success?: boolean, // for updates like post/put
    error?: string,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(401).json({ error: validation_res.error });
  }
  switch (req.method) {
    case 'GET': {
      const { id } = req.query;
      let user_id: number;
      let result: IResult;
      
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

async function getUser(_id: number): Promise<IResult> {
  await connectToDB();

  let user: IUser = await User.findOne({ _id }).exec();
  
  if (!user) {
    let payload = { success: false, error: 'User Not Found' };
    return { status_code: 404, payload };
  }

  return { status_code: 200, payload: { success: true, user } };
}