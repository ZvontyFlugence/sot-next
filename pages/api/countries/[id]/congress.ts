import User, { IUser } from '@/models/User';
import Region, { IRegion } from '@/models/Region';
import { validateToken } from '@/util/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import Country, { ICountry } from '@/models/Country';
import { ICongressUser } from '@/components/country/Government';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      let country_id: number;

      try {
        country_id = Number.parseInt(req.query?.id as string);
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid Country ID' });
      }

      let country: ICountry = await Country.findOne({ _id: country_id }).exec();
      if (!country)
        return res.status(404).json({ error: 'Country Not Found' });
      else if (country.government.congress.length === 0)
        return res.status(200).json({ congress: [] });

      let memberIds: number[] = country.government.congress.map(mem => mem.id);
      let congressMembers: IUser[] = await User.find({ _id: { $in: memberIds } }).exec();
      let congressUsers: ICongressUser[] = [];

      for (let member of congressMembers) {
        let region: IRegion = await Region.findOne({ _id: member.residence }).exec();
        let congressUser: ICongressUser = member;
        congressUser.residenceName = region.name;
        congressUsers.push(congressUser);
      }

      return res.status(200).json({ congress: congressUsers });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}