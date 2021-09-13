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
      // Ensure DB Conn
      await connectToDB();
      
      let countryId: number = -1;
      try {
        if (req.query?.countryId)
          countryId = Number.parseInt(req.query.countryId as string);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Country ID' });
      }

      // Get any war given country is a participant of
      let wars: IWar[] = await War.find({})
        .or([
          { source: countryId },
          { target: countryId },
          { sourceAllies: countryId },
          { targetAllies: countryId },
        ])
        .exec();
      return res.status(200).json({ wars: wars ?? [] });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}