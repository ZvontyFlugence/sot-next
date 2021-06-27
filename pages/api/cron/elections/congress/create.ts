import Election, { ElectionType, IElection } from "@/models/Election";
import Region, { IRegion } from "@/models/Region";
import { connectToDB } from "@/util/mongo";
import { Types } from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      // Create new inactive, uncompleted elections for every country
      let region_ids: number[] = await Region.find({})
        .exec()
        .then(docs => docs.map((doc: IRegion) => doc._id));

      let electionsToInsert: IElection[] = region_ids.map((id: number) => {
        return new Election({
          _id: new Types.ObjectId(),
          type: ElectionType.Congress,
          typeId: id,
        });
      });

      const inserted = await Election.insertMany(electionsToInsert);

      if (inserted)
        return res.status(200).json({ success: true });

      return res.status(500);
    }

    return res.status(401);
  } catch (e: any) {
    return res.status(500);
  }
}