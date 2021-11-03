import Election, { ElectionType } from '@/models/Election';
import Party from '@/models/Party';
import { IMap } from '@/pages/api/companies/doAction';
import { connectToDB } from '@/util/mongo';
import { UpdateWriteOpResult } from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      // Update every inactive, uncompleted election to become active
      let date: Date = new Date(Date.now());
      let month: number = date.getUTCDate() <= 5 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;
      let year: number = date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();

      const update: IMap = {
        query: {
          type: ElectionType.CountryPresident,
          month,
          year,
          isActive: false,
          isCompleted: false,
        },
        changes: {
          isActive: true,
        },
      };

      let updatedParties: UpdateWriteOpResult = await Party.updateMany({ $set: { cpCandidates: [] } });
      if (!updatedParties || !updatedParties.ok) {
        return res.status(500).json({ success: false, error: 'Something Went Wrong' });
      }

      const updated = await Election.updateMany(update.query, update.changes).exec();
      
      if (updated)
        return res.status(200).json({ success: true, updated: updated.nModified });
      
      return res.status(500);
    }
    
    return res.status(401);
  } catch (err: any) {
    return res.status(500);
  }
}