import War, { IWar } from '@/models/War';
import { validateToken } from '@/util/auth';
import { connectToDB } from '@/util/mongo';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      // Ensure DB Connection
      await connectToDB();
      
      let wars: IWar[] = await War.find({}).exec();
      return res.status(200).json({ wars: wars ?? [] });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}