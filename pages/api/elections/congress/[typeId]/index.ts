import Election, { ElectionType, IElection } from '@/models/Election';
import Region, { IRegion } from '@/models/Region';
import { GetElectionsResponse } from '@/util/apiHelpers';
import { validateToken } from '@/util/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      let countryId: number = -1;
      let date: Date = new Date(Date.now());
      let month = date.getUTCDate() < 25 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;
      let year = date.getUTCDate() > 25 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();

      try {
        countryId = Number.parseInt(req.query.typeId as string);
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid Parameters' });
      }

      let result = await getCongressElections(countryId, year, month);
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function getCongressElections(countryId: number, year: number, month: number): Promise<GetElectionsResponse> {
  let regions: IRegion[] = await Region.find({ owner: countryId }).exec();
  if (!regions)
    return { status_code: 404, payload: { error: 'Regions Not Found' } };

  let elections: IElection[] = [];

  for (let region of regions) {
    let query = {
      type: ElectionType.Congress,
      typeId: region._id,
      month,
      year,
    };

    let election: IElection = await Election.findOne(query).exec();
    if (!election)
      return { status_code: 404, payload: { error: 'Congress Election Not Found' } };

    elections.push(election);
  }

  return { status_code: 200, payload: { elections } };
}