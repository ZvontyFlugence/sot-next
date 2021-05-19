import Region, { IRegion } from "@/models/Region";
import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      let country_id: number;

      try {
        country_id = Number.parseInt(req.query?.id as string);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Country ID' });
      }

      let regions: IRegion[] = await Region.find({}).where({ owner: country_id }).exec();
      return res.status(200).json({ regions: regions || [] });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}