import Country, { ICountry } from '@/models/Country';
import Election, { ElectionType, IElection } from '@/models/Election';
import { connectToDB } from '@/util/mongo';
import { Types } from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      // Create new inactive, uncompleted election for every country
      let countries: ICountry[] = await Country.find({}).exec();

      let electionsToInsert: IElection[] = countries.map((country: ICountry) => {
        return new Election({
          _id: new Types.ObjectId(),
          type: ElectionType.CountryPresident,
          typeId: country._id,
          system: country.government.electionSystem,
        });
      });

      const inserted = await Election.insertMany(electionsToInsert);

      if (inserted)
        return res.status(200).json({ success: true });
      else 
        return res.status(500);
    }

    return res.status(401);
  } catch (e: any) {
    return res.status(500);
  }
}