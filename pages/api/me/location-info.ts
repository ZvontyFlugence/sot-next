import Country, { ICountry } from "@/models/Country";
import Region, { IRegion } from "@/models/Region";
import User, { IUser } from "@/models/User";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

interface ILocationInfo {
  region_id: number,
  region_name: string,
  owner_id: number,
  owner_name: string,
  owner_flag: string,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validate_res = await validateToken(req, res);
  if (validate_res.error) {
    return res.status(400).json({ error: validate_res.error });
  }

  switch (req.method) {
    case 'GET': {
      // Ensure db conn
      await connectToDB();
      
      let user: IUser = await User.findOne({ _id: validate_res.user_id }).exec();
      let region: IRegion = await Region.findOne({ _id: user.location }).exec();
      let owner: ICountry = await Country.findOne({ _id: region.owner }).exec();
      let locationInfo: ILocationInfo = {
        region_id: region._id,
        region_name: region.name,
        owner_id: owner._id,
        owner_name: owner.nick,
        owner_flag: owner.flag_code,
      };

      return res.status(200).json({ locationInfo });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}