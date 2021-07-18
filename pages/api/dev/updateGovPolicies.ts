import Country, { GovernmentType } from '@/models/Country';
import { connectToDB } from '@/util/mongo';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      await connectToDB();
      
      const updates = {
        policies: {
          allies: [],
          governmentType: GovernmentType.DEMOCRACY,
          embargos: [],
          minWage: 1.00,
          taxes: {
            import: 25,
            income: 10,
            vat: 1,
          },
          welcomeMessage: 'Welcome to State of Turmoil!',
        },
        pendingLaws: [],
        pastLaws: [],
      };

      let updated = await Country.updateMany({}, { $set: {...updates} }, { upsert: true }).exec();
      if (updated)
        return res.status(200).json({ success: true });

      return res.status(500).json({ success: false });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}