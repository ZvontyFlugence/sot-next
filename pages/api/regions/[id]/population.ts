import Region, { IRegion } from '@/models/Region';
import User, { IUser } from '@/models/User';
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
            let residents: IUser[] = await User.find({ $or: [ { residence: region_id }, { location: region_id } ] }).exec();
            let citizens: number = residents.reduce((n: number, resident: IUser) => {
                return (resident.country === region.owner) ? n + 1 : n;
            }, 0);

            return res.status(200).json({ population: residents.length, citizens });
        }
        default:
            return res.status(404).json({ error: 'Unhandled HTTP Method' });
    }
}