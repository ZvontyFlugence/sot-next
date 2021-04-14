import User, { IUser, IUserStats } from '@/models/User';
import Country, { ICountry } from '@/models/Country';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDB } from '@/util/mongo';

const CitizenStats = {
  STRENGTH: 'strength',
  XP: 'xp',
}

interface IResult {
  status_code: number,
  payload: {
    citizens?: IUserStats[],
    error?: string,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      const { scope, stat, sort, limit, country } = req.query;

      if (typeof scope !== 'string' || typeof stat !== 'string' || (sort && typeof sort !== 'string') ||
        typeof limit !== 'string' || (country && typeof country !== 'string')) {
        return res.status(400).json({ error: 'Invalid Query Parameters' });
      }

      let result: IResult;
      try {
        result = await get(scope, stat, stat as string, Number.parseInt(limit), Number.parseInt(country as string));
      } catch (_e) {
        result = { status_code: 400, payload: { error: 'Something Went Wrong!' } };
      }

      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function get(scope: string, stat: string, sort: string, limit: number, country?: number): Promise<IResult> {
  let citizens: IUser[];

  // Ensure db connection established
  await connectToDB();

  // Fetch citizens by scope
  switch (scope) {
    case 'country': {
      citizens = await User.find({ country }).exec();
    }
    case 'global':
    default: {
      citizens = await User.find({}).exec();
    }    
  }

  if (!citizens || citizens?.length === 0)
    return { status_code: 404, payload: { error: 'No Citizens Found' } };

  // Sort by stat and sort order
  switch (stat) {
    case CitizenStats.STRENGTH:
    case CitizenStats.XP: {
      if (sort === 'desc') {
        citizens.sort((a, b) => a[stat] - b[stat]);
      } else {
        citizens.sort((a, b) => b[stat] - a[stat]);
      }
      break;
    }
    default: {
      let payload = { error: 'Unsupported Citizen Statistic' };
      return { status_code: 400, payload };
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

  return { status_code: 200, payload: { citizens: citizenStats } };
}