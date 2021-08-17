import Country, { ICountry } from "@/models/Country";
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
      // Ensure DB Connection
      await connectToDB();
      let country_id: number = -1;
      try {
        country_id = Number.parseInt(req.query.id as string);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Country ID' });
      }

      let country: ICountry = await Country.findOne({ _id: country_id }).exec();
      return res.status(200).json({ country });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}