import Newspaper, { INewspaper } from "@/models/Newspaper";
import User, { IUser } from "@/models/User";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      // Ensure DB Connection
      await connectToDB();
      
      let country: number | undefined;
      try {
        if (req.query?.country)
          country = Number.parseInt(req.query.country as string);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Country ID' });
      }

      let result: IGetNewsResponse = await getNewspapers({ country });
      return res.status(200).json({ ...result });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

interface IGetNewsRequest {
  country?: number;
}

interface IGetNewsResponse {
  newspapers?: INewspaper[];
}

async function getNewspapers(data: IGetNewsRequest): Promise<IGetNewsResponse> {
  let newspapers: INewspaper[];

  if (data.country) {
    let countryCits: IUser[] = await User.find({ country: data.country }).exec();
    newspapers = await Newspaper.find({ author: { $in: countryCits.map(usr => usr._id) } }).exec();
  } else {
    newspapers = await Newspaper.find({}).exec();
  }

  return { newspapers: newspapers ?? [] };
}