import Election, { ElectionType, IElection } from '@/models/Election';
import Party from '@/models/Party';
import User, { IUser } from '@/models/User';
import { connectToDB } from '@/util/mongo';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Validate GitHub Actions Secret Key
  const key = req.headers.authorization.split(' ')[1];

  try {
    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      let session = await Election.startSession();

      await session.withTransaction(async () => {
        let date: Date = new Date(Date.now());
        const query = {
          month: date.getUTCMonth() + 1,
          year: date.getUTCFullYear(),
          isActive: true,
          type: ElectionType.PartyPresident,
        };

        let elections: IElection[] = await Election.find(query).exec();

        return await Promise.all(elections.map(async (election: IElection) => {
          // Calculate Winner
          let maxVotes: number = 0;
          let winners: number[] = [];

          for (let candidate of election.candidates) {
            if (candidate.votes.length > maxVotes) {
              maxVotes = candidate.votes.length;
              winners = [candidate.id];
            } else if (candidate.votes.length === maxVotes) {
              winners.push(candidate.id);
            }
          }

          if (winners.length > 1) {
            // Find candidate w/ most XP
            let maxXP: number = 0;
            let mostExperienced: number = -1;
            for (let winner of winners) {
              let user: IUser = await User.findOne({ _id: winner });
              if (user.xp > maxXP) {
                maxXP = user.xp;
                mostExperienced = winner;
              }
            }
            
            winners = [mostExperienced];
          }

          election.winner = winners.length === 1 ? winners[0] : null;
          election.isActive = false;
          election.isCompleted = true;

          // Update user with alert and gold
          if (election.winner !== null) {
            let { partyName } = election.candidates.find(can => can.id === election.winner);
            let alert = {
              read: false,
              type: 'ELECTED_PP',
              message: `You have been elected as Party President of ${partyName} and awarded 5 gold`,
              timestamp: new Date(Date.now()),
            };

            await User.updateOne({ _id: election.winner }, { $inc: { gold: 5 }, $push: { alerts: alert } });
          }

          // Set winner as Party President
          let updatedParty = await Party.updateOne({ _id: election.typeId }, { $set: { president: election.winner, vp: -1 } });
          if (!updatedParty)
            throw new Error('Failed to Update Party President');

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