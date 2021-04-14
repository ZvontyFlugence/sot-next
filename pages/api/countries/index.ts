import Country, { ICountry } from "@/models/Country";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // let validation_res = await validateToken(req, res);
  // if (validation_res.error) {
  //   return res.status(401).json({ error: validation_res.error });
  // }
  
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