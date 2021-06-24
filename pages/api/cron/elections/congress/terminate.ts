import Country, { ICountry } from '@/models/Country';
import Election, { ElectionType, ICandidate, IElection } from '@/models/Election';
import Region from '@/models/Region';
import User, { IUser } from '@/models/User';
import { connectToDB } from '@/util/mongo';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Action Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {

    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      let session = await Election.startSession();

      await session.withTransaction(async () => {
        let date: Date = new Date(Date.now());
        const query = {
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
          isActive: true,
          type: ElectionType.Congress,
        };

        let elections: IElection[] = await Election.find(query);

        return await Promise.all(elections.map(async (election: IElection) => {
          let candidates: ICandidate[] = await Promise.all(election.candidates.map(async (candidate: ICandidate) => {
            let user: IUser = await User.findById(candidate.id);
            return { ...candidate, xp: user.xp } as ICandidate;
          }));

          candidates.sort((a: ICandidate, b: ICandidate) => {
            if (a.votes.length > b.votes.length)
              return 1;
            else if (a.votes.length < b.votes.length)
              return -1;
            

            if (a.xp > b.xp) {
              return 1;
            } else if (a.xp < b.xp) {
              return -1;
            }

            return 0;
          });

          // TODO: Figure out alternate ways to appropriate congress seats
          // Candidate is one of three winners, as long as the candidate received at least 1 vote, and has the top 
          let receivedVotes = candidates.filter((candidate: ICandidate) => candidate.votes.length > 0);
          election.winner = receivedVotes.length >= 3 ? receivedVotes.splice(0, 3).map(c => c.id) : receivedVotes.map(c => c.id);
          election.isActive = false;
          election.isCompleted = true;

          // Set representatives for Region
          let updatedRegion = await Region.updateOne({ _id: election.typeId }, { $set: { representatives: election.winner ?? [] } });
          if (!updatedRegion)
            throw new Error('Failed to Update Region Representatives');

          return await election.save();
        }));
      });

      session.endSession();
      return res.status(200).json({ success: true });
    }

    return res.status(401);
  } catch (e: any) {
    return res.status(500);
  }
}