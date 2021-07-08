import Election, { ElectionType, IElection } from '@/models/Election';
import { validateToken } from '@/util/auth';
import { GetElectionResponse } from '@/util/apiHelpers';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      let countryId: number = -1;
      let year: number = -1;
      let month: number = -1;

      try {
        countryId = Number.parseInt(req.query.id as string);
        year = Number.parseInt(req.query.year as string);
        month = Number.parseInt(req.query.month as string);
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid Parameters' });
      }

      let result = await getCPElection(countryId, year, month);
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function getCPElection(countryId: number, year: number, month: number): Promise<GetElectionResponse> {
  let query = {
    type: ElectionType.CountryPresident,
    typeId: countryId,
    month,
    year,
  };

  let election: IElection = await Election.findOne(query).exec();
  if (!election)
    return { status_code: 404, payload: { error: 'Country President Election Not Found' } };
  
  return { status_code: 200, payload: { election } };
}