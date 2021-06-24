import Election, { ElectionType } from '@/models/Election';
import { connectToDB } from '@/util/mongo';
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

      const update = {
        query: {
          type: ElectionType.PartyPresident,
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
          isActive: false,
          isCompleted: false,
        },
        changes: {
          isActive: true,
        },
      };

      const updated = await Election.updateMany(update.query, update.changes).exec();
      
      if (updated)
        return res.status(200).json({ success: true, updated: updated.nModified });
      
      return res.status(500);
    }

    return res.status(401);
  } catch (e: any) {
    return res.status(500);
  }
}