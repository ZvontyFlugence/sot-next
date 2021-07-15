import Country, { ICountry, ILawVote } from '@/models/Country';
import { LawType } from '@/util/apiHelpers';
import { connectToDB } from '@/util/mongo';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Validate GitHub Actions Secret Key
    const key = req.headers?.authorization.split(' ')[1];

    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      // Look for all pending laws in every country & process them
      let session = await Country.startSession();

      await session.withTransaction(async () => {
        let date: Date = new Date(Date.now());
        let countries: ICountry[] = await Country.find({ pendingLaws: { $exists: true, $ne: [] }});

        return await Promise.all(countries.map(async (country: ICountry) => {
          for (let pendingLaw of country.pendingLaws) {
            // Only handle laws that have expired
            if (new Date(pendingLaw.expires) < date) {
              // Decide if law passes
              let score: number = pendingLaw.votes.reduce((accum: number, vote: ILawVote) => {
                if (vote.choice === 'yes')
                  return accum++;
                else if (vote.choice === 'no')
                  return accum--;
                
                return accum;
              }, 0);

              // TODO: Do more checks like meeting quorum, etc.
              if (score > 0) {
                pendingLaw.passed = true;
                // Update Country Policy
                switch (pendingLaw.type) {
                  case LawType.INCOME_TAX: {
                    country.policies.taxes.income = pendingLaw.details.percent;
                    break;
                  }
                  default:
                    break;
                }
              } else {
                pendingLaw.passed = false;
              }
            }
          }

          return await country.save();
        }));
      });

      session.endSession();

      return res.status(200).json({ success: true });
    }
  } catch (err: any) {
    return res.status(500);
  }
}