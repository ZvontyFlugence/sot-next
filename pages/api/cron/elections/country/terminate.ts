import Country, { ElectionSystem, ICountry } from '@/models/Country';
import Election, { ECVote, ElectionType, IElection, IVoteObject } from '@/models/Election';
import Region, { IRegion } from '@/models/Region';
import User, { IUser } from '@/models/User';
import { getDemographics } from '@/pages/api/countries/[id]/demographics';
import { roundMoney } from '@/util/apiHelpers';
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
          type: ElectionType.CountryPresident,
        };

        let elections: IElection[] = await Election.find(query);

        return await Promise.all(elections.map(async (election: IElection) => {
          if (election.candidates.length === 0) {
            return await election.updateOne({ isActive: false, isCompleted: true });
          }

          // Calculate winner
          let winners: number[] = [];
          let ecResults: IVoteObject = {};
          let candidateTallies: { [candidate: number]: number } = {};
          let regionTallies: { [region: number]: number } = {};

          if (election.system === ElectionSystem.PopularVote) {
            let maxVotes: number = 0;
            for (let candidate of election.candidates) {
              if (candidate.votes.length > maxVotes) {
                maxVotes = candidate.votes.length;
                winners = [candidate.id];
              } else if (candidate.votes.length === maxVotes) {
                winners.push(candidate.id);
              }
            }

            if (winners.length > 1) {
              // Find candidate with most XP
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
          } else if (election.system === ElectionSystem.ElectoralCollege) {
            let regions: number[] = [];
            let votes: IVoteObject = {};

            // Get each region's per-candidate results
            for (let candidate of election.candidates) {
              for (let voteObj of (candidate.votes as ECVote[])) {
                if (!regions.includes(voteObj.location)) {
                  // No candidate results from region exist yet
                  regions.push(voteObj.location);
                  votes[voteObj.location] = { [candidate.id]: voteObj.tally.length };
                } else {
                  // Another candidates results for region exists, add current candidate's results to data set
                  let index: number = regions.findIndex(reg => reg === voteObj.location);
                  votes[index][candidate.id] = voteObj.tally.length;
                }
              }
            }

            // Compare Candidate Results in each region to decide region winner
            let regionWinners: number[] = [];
            for (let region of regions) {
              let regionWinner: number | null = null;
              let regionMaxVotes: number = 0;
              for (let candidateStr in votes[region]) {
                let candidate: number = Number.parseInt(candidateStr);
                if (votes[region][candidate] > regionMaxVotes) {
                  regionMaxVotes = votes[region][candidate];
                  regionWinner = candidate;
                } else if (votes[region][candidate] === regionMaxVotes) {
                  let canA: IUser = await User.findOne({ _id: regionWinner });
                  let canB: IUser = await User.findOne({ _id: candidate });

                  if (canB && canA && canB.xp > canA.xp) {
                    regionWinner = candidate;
                  }
                }
              }

              if (regionMaxVotes > 0) {
                regionWinners.push(regionWinner);
              }
              
              ecResults[region] = votes[region];
            }

            // Tally total votes for each regionWinner
            let finalTally: number[] = [];
            let country: ICountry = await Country.findOne({ _id: election.typeId });
            let { population: countryPop } = await getDemographics(election.typeId);
            for (let region of regions) {
              let regionCitizens: IUser[] = await User.find({ country: election.typeId, location: region });
              let regionPop: number = regionCitizens.length;
              let percent: number = (regionPop / countryPop);
              let tally: number = Math.round(country.government?.totalElectoralVotes * percent);
              regionTallies[region] = tally;
              finalTally.push(tally);
            }

            // Sum total votes for each candidate
            for (let region of regions) {
              let index: number = regions.findIndex(reg => reg === region);
              if (index < 0) {
                continue;
              }

              let winningCandidate: number = regionWinners[index];
              if (!candidateTallies[winningCandidate]) {
                candidateTallies[winningCandidate] = finalTally[index];
              } else {
                candidateTallies[winningCandidate] += finalTally[index];
              }
            }

            // Decide election winner by votes or xp in the case of a tie
            let winningCandidate: number | null = null;
            let maxVotes: number = 0;
            for (let candidateStr in candidateTallies) {
              let candidate: number = Number.parseInt(candidateStr);
              if (candidateTallies[candidate] > maxVotes) {
                maxVotes = candidateTallies[candidate];
                winningCandidate = candidate;
              } else if (candidateTallies[candidate] === maxVotes) {
                let canA: IUser = await User.findOne({ _id: winningCandidate });
                let canB: IUser = await User.findOne({ _id: candidate });

                if (canB && canA && canB.xp > canA.xp) {
                  winningCandidate = candidate;
                }
              }
            }

            winners = [winningCandidate];
          }

          election.winner = winners.length === 1 ? winners[0] : null;
          election.isActive = false;
          election.isCompleted = true;
          election.tally = election.system === ElectionSystem.ElectoralCollege ? candidateTallies : undefined;
          election.ecResults = election.system === ElectionSystem.ElectoralCollege ? ecResults : undefined;
          election.regionTallies = election.system === ElectionSystem.ElectoralCollege ? regionTallies : undefined;

          // Update User with alert and gold
          let alert = {
            read: false,
            type: 'ELECTED_CP',
            message: 'You have been elected as Country President and awarded 5 Gold!',
            timestamp: new Date(Date.now()),
          };
          let winningUser: IUser = await User.findOne({ _id: winners[0] });
          winningUser.gold = roundMoney(winningUser.gold + 5);
          winningUser.alerts.push(alert);
          let updated = await winningUser.save();
          if (!updated)
            throw new Error('Failed to Update Winning Candidate');

          // Set winner as Country CP
          let updatedCountry = await Country.updateOne({ _id: election.typeId }, { $set: {
            'government.president': election.winner,
            'government.vp': null,
            'government.cabinet': { mofa: null, mod: null, mot: null },
          }});
          if (!updatedCountry)
            throw new Error('Failed to Update Country Government');

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