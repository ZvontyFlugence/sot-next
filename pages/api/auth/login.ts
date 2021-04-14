import User, { IUser } from "@/models/User";
import { connectToDB } from "@/util/mongo";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from "next";

// TODO: Handle expired tokens to refresh them
export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST': {
      const { email, password } = JSON.parse(req.body);
      // Connect To DB
      await connectToDB();

      // Look for matching account
      let account: IUser = await User.findOne({ email }).exec();
      if (!account) {
        return res.status(400).json({ success: false, error: 'Invalid Credentials' });
      }

      // Check if password matches
      if (await bcrypt.compare(password, account.password)) {
        let token = await jwt.sign({ user_id: account._id }, process.env.JWT_SECRET, {
          expiresIn: '7d',
        });
        return res.status(200).json({ success: true, token });
      }

      return res.status(400).json({ success: false, error: 'Invalid Credentials' });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Request' });
  }
}