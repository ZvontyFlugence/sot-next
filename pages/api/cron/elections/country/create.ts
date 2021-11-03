import Country, { ICountry } from '@/models/Country';
import Election, { ElectionType, IElection } from '@/models/Election';
import Party, { IParty } from '@/models/Party';
import { connectToDB } from '@/util/mongo';
import { Types, UpdateWriteOpResult } from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      // Clear out all party cp canidates
      let updatedParties: UpdateWriteOpResult = await Party.updateMany({ $set: { cpCandidates: [] } });
      if (!updatedParties || !updatedParties.ok) {
        return res.status(500).json({ success: false, error: 'Something Went Wrong' });
      }

      // Create new inactive, uncompleted election for every country
      let countries: ICountry[] = await Country.find({}).exec();

      let date: Date = new Date(Date.now());
      let year: number = date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
      let month: number = date.getUTCDate() <=5 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;

      let electionsToInsert: IElection[] = countries.map((country: ICountry) => {
        return new Election({
          _id: new Types.ObjectId(),
          type: ElectionType.CountryPresident,
          typeId: country._id,
          system: country.government.electionSystem,
          year,
          month,
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