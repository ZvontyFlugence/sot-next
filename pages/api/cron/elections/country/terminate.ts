import Election from '@/models/Election';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Update every active, uncompleted election to be inactive and completed
      let updated = await Election.updateMany({ isActive: true, isCompleted: false }, { isActive: false, isCompleted: true });
      if (updated)
        return res.status(200).json({ updated: updated.nModified });
      else throw new Error('Not all terminated');
    }

    return res.status(401);
  } catch (e: any) {
    return res.status(500);
  }
}