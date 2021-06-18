import Country, { ICountry } from '@/models/Country';
import Election, { ElectionType, IElection } from '@/models/Election';
import { Types } from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Create new inactive, uncompleted election for every country
      let country_ids: number[] = await Country.find()
        .then(docs => docs.map((doc: ICountry) => doc._id));

      let electionsToInsert: IElection[] = country_ids.map((id: number) => {
        return new Election({
          _id: new Types.ObjectId(),
          type: ElectionType.CountryPresident,
          country: id,
        });
      });

      const inserted = await Election.insertMany(electionsToInsert);
      if (inserted)
        return res.status(200).json({ success: true });
      else throw new Error('Not all Inserted');
    }

    return res.status(401);
  } catch (e: any) {
    return res.status(500);
  }
}