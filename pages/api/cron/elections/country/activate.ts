import Election from '@/models/Election';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Update every inactive, uncompleted election to become active
      const updated = await Election.updateMany({ isActive: false, isCompleted: false }, { isActive: true });
      if (updated)
        return res.status(200).json({ updated: updated.nModified });
      else throw new Error('Not All Activated');
    }
    
    return res.status(401);
  } catch (err: any) {
    return res.status(500);
  }
}