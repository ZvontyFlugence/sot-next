import User, { IUser } from "@/models/User";
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

      let population: number = 0;
      let newCitizens: number = 0;
      let averageLevel: number = 0;
      let citizens: IUser[] = await User.find({}).where({ country: country_id }).exec();

      if (citizens && citizens.length > 0) {
        population = citizens.length;
        newCitizens = citizens.filter(c => isBornToday(new Date(c.createdOn))).length;
        let levelSum = citizens.reduce((accum, citizen) => accum + citizen.level, 0);
        averageLevel = Math.round(levelSum / citizens.length);
      }

      return res.status(200).json({
        population,
        newCitizens,
        averageLevel,
      });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

function isBornToday(createdOn: Date) {
  let today = new Date(Date.now());
  return (createdOn.getUTCDate() === today.getUTCDate()) &&
    (createdOn.getUTCMonth() === today.getUTCMonth()) &&
    (createdOn.getUTCFullYear() === today.getUTCFullYear());
}