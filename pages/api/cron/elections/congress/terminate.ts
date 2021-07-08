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
          // Candidate is one of three winners, as long as the candidate received at least 1 vote, and is in the top 3 
          let receivedVotes = candidates.filter((candidate: ICandidate) => candidate.votes.length > 0);
          election.winner = receivedVotes.length >= 3 ? receivedVotes.splice(0, 3).map(c => c.id) : receivedVotes.map(c => c.id);
          election.isActive = false;
          election.isCompleted = true;

          // Update Winners with alert and gold
          for (let winner of election.winner) {
            let { locationName } = election.candidates.find(can => can.id === winner);
            let alert = {
              read: false,
              type: 'ELECTED_CONGRESS',
              message: `You have been elected to Congress as a representative of ${locationName} and awarded 5 gold`,
              timestamp: new Date(Date.now()),
            };

            await User.updateOne({ _id: winner }, { $inc: { gold: 5 }, $push: { alerts: alert } });
          }

          // Set representatives for Region
          let updatedRegion = await Region.updateOne({ _id: election.typeId }, { $set: { representatives: election.winner ?? [] } });
          if (!updatedRegion)
            throw new Error('Failed to Update Region Representatives');

          // Push to country congress list
          let region = await Region.findOne({ _id: election.typeId }).exec();
          await Country.updateOne({ _id: region.owner }, { $push: { 'government.congress': { $each: election.winner } } });

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