import Region from "@/models/Region";
import type { NextApiRequest, NextApiResponse } from 'next';

// DEV ONLY ENDPOINT

interface IUpdateNeighborsBody {
  region_id: number;
  neighbors: number[];
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST': {
      const { region_id, neighbors } = req.body as IUpdateNeighborsBody;

      if (!region_id || region_id < 1)
        return res.status(400).json({ success: false, error: 'Invalid Region ID' });
      else if (neighbors === [])
        return res.status(400).json({ success: false, error: 'Neighbors List Cannot Be Empty' });

      let updated = await Region.updateOne({ _id: region_id }, { $set: { neighbors } }).exec();
      if (updated.ok)
        return res.status(200).json({ success: true });

      return res.status(500).json({ success: false, error: 'Something Went Wrong' });
    }
    default:  
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}