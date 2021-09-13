import User, { IUser, IUserStats } from '@/models/User';
import Country, { ICountry } from '@/models/Country';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDB } from '@/util/mongo';
import { CitizenStats } from '@/util/constants';
import { ActionResult, defaultActionResult } from '@/util/apiHelpers';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      const { scope, stat, sort, limit, country } = req.query;

      if (typeof scope !== 'string' || typeof stat !== 'string' || (sort && typeof sort !== 'string') ||
        (limit && typeof limit !== 'string') || (country && typeof country !== 'string')) {
        return res.status(400).json({ error: 'Invalid Query Parameters' });
      }

      let result: ActionResult;
      try {
        result = await get(scope, stat, sort as string, Number.parseInt(limit as string), Number.parseInt(country as string));
      } catch (_e) {
        result = { status_code: 400, payload: { success: false, error: 'Something Went Wrong!' } };
      }

      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function get(scope: string, stat: string, sort: string = 'desc', limit?: number, country?: number): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  let citizens: IUser[];

  // Ensure db connection established
  await connectToDB();

  try {
    // Fetch citizens by scope
    switch (scope) {
      case 'country': {
        citizens = await User.find({ country }).exec();
        break;
      }
      case 'global':
      default: {
        citizens = await User.find({}).exec();
        break;
      }    
    }

    if (!citizens || citizens?.length === 0) {
      ret.status_code = 404;
      ret.payload.error = 'No Citizens Found';
      throw new Error(ret.payload.error);
    }

    // Sort by stat and sort order
    switch (stat) {
      case CitizenStats.STRENGTH:
      case CitizenStats.XP: {
        if (sort === 'asc') {
          citizens.sort((a, b) => a[stat] - b[stat]);
        } else if (sort === 'desc') {
          citizens.sort((a, b) => b[stat] - a[stat]);
        }
        break;
      }
      default: {
        ret.status_code = 400;
        ret.payload.error = 'Unsupported Citizen Stat';
        throw new Error(ret.payload.error);
      }
    }

    if (limit) {
      citizens = citizens.slice(0, limit);
    }

    let citizenStats: IUserStats[] = await Promise.all(citizens.map(async (u: IUser) => {
      let country: ICountry = await Country.findOne({ _id: u.country }).exec();
      return {
        _id: u._id,
        username: u.username,
        image: u.image,
        country: {
          _id: country._id,
          flag_code: country.flag_code,
          name: country.name,
        },
        [stat]: u[stat],
      };
    }));

    ret.status_code = 200;
    ret.payload = { success: true, citizens: citizenStats };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}