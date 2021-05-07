import Shout, { IShout } from '@/models/Shout';
import User, { IUser } from '@/models/User';
import { validateToken } from '@/util/auth';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res?.error) {
    return res.status(401).json({ error: validation_res.error });
  }

  switch (req.method) {
    case 'GET': {
      let scope: 'global' | 'country' | 'party' | 'unit';
      let scope_id: number;
      try {
        let scope_val = req.query.scope as string;
        if (scope_val === 'global' || scope_val === 'country' || scope_val === 'party' || scope_val === 'unit')
          scope = scope_val;
        scope_id = parseInt(req.query.scope_id as string);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Query Parameters' });
      }

      let shouts: IShout[] = await Shout.find({ scope, scope_id }).exec();
      let authors: { [author_id: number]: { username: string, image: string } } = {};

      for (let i = 0; i < shouts.length; i++) {
        let author: IUser = await User.findOne({ _id: shouts[i].author }).exec();
        if (!authors[author._id]) {
          authors[author._id] = {
            username: author.username,
            image: author.image,
          };
        }
      }

      return res.status(200).json({ shouts, authors });
    }
    default:
      return res.status(404).json({ error: 'Unsupported HTTP Method' });
  }
}