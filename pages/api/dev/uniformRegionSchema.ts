import Region from '@/models/Region';
import { UpdateWriteOpResult } from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case 'GET': {
            let updatedSchemas: UpdateWriteOpResult = await Region.updateMany({
                type: { $exists: false }
            }, {
                $set: { type: 'single' }
            }, {
                upsert: true
            }).exec();

            if (updatedSchemas.ok) {
                return res.status(200).json({ success: true });
            }

            return res.status(500).json({ success: false });
        }
        default:
            return res.status(404).json({ error: 'Unhandled HTTP Method' });
    }
}