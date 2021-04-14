import Company, { ICompany } from "@/models/Company";
import Country, { ICountry } from "@/models/Country";
import Region, { IRegion } from "@/models/Region";
import { ILocationInfo } from "@/util/apiHelpers";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      const { id } = req.query;
      let company: ICompany = await Company.findOne({ _id: Number.parseInt(id as string) }).exec();
      let location: IRegion = await Region.findOne({ _id: company.location }).exec();
      let owner: ICountry = await Country.findOne({ _id: location.owner }).exec();
      let location_info: ILocationInfo = {
        region_name: location.name,
        owner_id: owner._id,
        owner_name: owner.name,
        owner_flag: owner.flag_code,
      };

      return res.status(200).json({ location_info });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Request' });
  }
}