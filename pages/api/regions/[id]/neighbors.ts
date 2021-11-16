import Region, { IRegion } from '@/models/Region';
import { validateToken } from '@/util/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    let validation_res = await validateToken(req, res);
    if (validation_res?.error)
        return res.status(401).json({ error: validation_res.error });

    switch (req.method) {
        case 'GET': {
            let region_id: number;

            try {
                region_id = Number.parseInt(req.query?.id as string);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid Region ID' });
            }

            let region: IRegion = await Region.findOne({ _id: region_id }).exec();
            if (!region)
                return res.status(404).json({ error: 'Region Not Found' });

            let neighbors: IRegion[] = await Promise.all(region.neighbors.map(async (neighbor_id: number) => {
                return await Region.findOne({ _id: neighbor_id }).exec();
            }));

            return res.status(200).json({ neighbors });
        }
        default:
            return res.status(404).json({ error: 'Unhandled HTTP Method' });
    }
}