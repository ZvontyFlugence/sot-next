import Country, { ICountry } from "@/models/Country";
import User, { IUser } from "@/models/User";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

interface IWalletInfo {
  [country: number]: {
    country_id: number,
    flag_code: string,
    currency: string,
    amount: number,
  }
}

interface IWalletItem {
  currency: string,
  amount: number,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validate_res = await validateToken(req, res);
  if (validate_res.error) {
    return res.status(400).json({ error: validate_res.error });
  }

  switch (req.method) {
    case 'GET': {
      // Ensure db connection
      await connectToDB();
      
      let user: IUser = await User.findOne({ _id: validate_res.user_id }).exec();
      let walletInfo: IWalletInfo = {};
      for (let cc of (user.wallet as Array<IWalletItem>)) {
        let country: ICountry = await Country.findOne({ currency: cc.currency }).exec();
        walletInfo[country._id] = {
          country_id: country._id,
          flag_code: country.flag_code,
          ...cc,
        };
      }

      return res.status(200).json({ walletInfo });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}