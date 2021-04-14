import Company, { ICompany } from "@/models/Company";
import Country, { ICountry } from "@/models/Country";
import Region, { IRegion } from "@/models/Region";
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
      
      const { user_id } = validation_res;
      let companies: ICompany[] = await Company.find({})
        .where('ceo')
        .equals(user_id)
        .exec();

      let user_comps: any = await Promise.all(companies.map(async (comp: ICompany) => {
        let location: IRegion = await Region.findOne({ _id: comp.location as number }).exec();
        let owner: ICountry = await Country.findOne({ _id: location.owner }).exec();
        let location_info = {
          region_id: location._id,
          region_name: location.name,
          owner_id: owner._id,
          owner_name: owner.nick,
          owner_flag: owner.flag_code,
        };

        return { ...comp, location_info };
      }));

      return res.status(200).json({ companies: user_comps });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}