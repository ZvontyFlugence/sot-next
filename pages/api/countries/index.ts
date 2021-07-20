import Country, { ICountry } from "@/models/Country";
import { connectToDB } from "@/util/mongo";
import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {  
  switch (req.method) {
    case 'GET': {
      await connectToDB();
      let countries: ICountry[] = await Country.find({}).exec();
      return res.status(200).json({ countries });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}