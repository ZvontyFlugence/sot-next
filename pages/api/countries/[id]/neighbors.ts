import Region, { IRegion } from '@/models/Region';
import { validateToken } from '@/util/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      let country_id: number;
      let target_id: number;

      try {
        country_id = Number.parseInt(req.query?.id as string);
        target_id = Number.parseInt(req.query?.target as string);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Country or Target Country ID' });
      }

      let regions: IRegion[] = await getNeighboringRegions(country_id, target_id);
      return res.status(200).json({ regions: regions || [] });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

interface INeighborSet {
  [regionId: number]: boolean;
}

async function getNeighboringRegions(country: number, target: number): Promise<IRegion[]> {
  let targetRegions: IRegion[] = await Region.find({ owner: target }).exec();
  let sourceRegions: IRegion[] = await Region.find({ owner: country }).exec();

  let neighbors: INeighborSet = sourceRegions.reduce((accum: INeighborSet, region: IRegion) => {
    for (let neighbor of region.neighbors) {
      if (!accum[neighbor])
        accum[neighbor] = true;
    }

    return accum;
  }, {} as INeighborSet);

  return targetRegions.filter(reg => neighbors[reg._id]);
}