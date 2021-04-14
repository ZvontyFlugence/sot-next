import { NextApiRequest, NextApiResponse } from "next";
import jwt from 'jsonwebtoken';
import User, { IUser } from "@/models/User";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(401).json({ error: validation_res.error });
  }

  switch (req.method) {
    case 'GET': {
      // Ensure DB conn
      await connectToDB();

      const { user_id } = validation_res;
      let user: IUser = await User.findOne({ _id: user_id }).exec();

      if (user) {
        return res.status(200).json({ user });
      }

      return res.status(404).json({ error: 'User Not Found' });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}