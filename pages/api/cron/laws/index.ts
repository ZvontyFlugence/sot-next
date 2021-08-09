import Country, { IAlly, IChangeImportTax, IChangeIncomeTax, IChangeVATTax, ICountry, IDeclareWar, IEmbargo, ILawVote, IPeaceTreaty, IPrintMoney, ISetMinWage } from '@/models/Country';
import User, { IAlert } from '@/models/User';
import War from '@/models/War';
import { LawType, roundMoney } from '@/util/apiHelpers';
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
        let updates: { [key: string]: any } = {};

        return await Promise.all(countries.map(async (country: ICountry) => {
          for (let pendingLaw of country.pendingLaws) {
            // Only handle laws that have expired
            if (new Date(pendingLaw.expires) <= date) {
              // Decide if law passes
              let score: number = pendingLaw.votes.reduce((accum: number, vote: ILawVote) => {
                if (vote.choice === 'yes')
                  accum++;
                else if (vote.choice === 'no')
                  accum--;
                
                return accum;
              }, 0);

              let govMembers: number[] = [
                country.government.president,
                country.government.vp,
                ...Object.values(country.government.cabinet),
                ...country.government.congress,
              ].filter(mem => mem !== null && mem > 0);

              // At least 50% of government members must vote to reach quorum
              let quorum: number = Math.ceil(govMembers.length / 2);

              if (score > 0 && pendingLaw.votes.length >= quorum) {
                pendingLaw.passed = true;
                // Update Country Policy
                switch (pendingLaw.type) {
                  case LawType.ALLIANCE: {
                    let alliance: IAlly = (pendingLaw.details as IAlly);

                    // Set Alliance Expiration for 30 days from now
                    let expires: Date = new Date(Date.now());
                    expires.setUTCDate(expires.getUTCDate() + 30);
                    alliance.expires = expires;

                    updates['policies.allies'] = [...country.policies.allies, alliance];
                    break;
                  }
                  case LawType.DECLARE_WAR: {
                    let target: IDeclareWar = (pendingLaw.details as IDeclareWar);

                    let targetCountry: ICountry = await Country.findOne({ _id: target.country });

                    // Create new War record in DB
                    let newWar = new War({
                      source: country._id,
                      target: targetCountry._id,
                      sourceAllies: [country._id, ...country.policies.allies.map(ally => ally.country)],
                      targetAllies: [targetCountry._id, ...targetCountry.policies.allies.map(ally => ally.country)],
                    });

                    newWar.save();
                    break;
                  }
                  case LawType.EMBARGO: {
                    let embargo: IEmbargo = (pendingLaw.details as IEmbargo);

                    // Set Embargo Expiration for 30 days from now
                    let expires: Date = new Date(Date.now());
                    expires.setUTCDate(expires.getUTCDate() + 30);
                    embargo.expires = expires;

                    updates['policies.embargos'] = [...country.policies.embargos, embargo];
                    break;
                  }
                  case LawType.IMPEACH_CP: {
                    let replacement: number | null = null;
                    if (country.government.vp && country.government.vp > 0) {
                      // Replace CP with VP
                      replacement = country.government.vp;
                    }

                    // Remove CP and don't replace him, VP becomes null, but Cabinet stays
                    updates['government.president'] = replacement;
                    updates['government.vp'] = null;

                    let alert: IAlert = {
                      type: 'IMPEACHED',
                      read: false,
                      message: 'You\'ve been impeached and removed from your position as Country President',
                      timestamp: new Date(Date.now()),
                    };

                    await User.updateOne({ _id: country.government.president }, { $push: { alerts: alert } });
                    break;
                  }
                  case LawType.INCOME_TAX: {
                    updates['policies.taxes.income'] = (pendingLaw.details as IChangeIncomeTax).percentage;
                    break;
                  }
                  case LawType.IMPORT_TAX: {
                    let importDetails = pendingLaw.details as IChangeImportTax;
                    let productId: number = Number.parseInt(Object.keys(importDetails)[0]);
                    updates[`policies.taxes.import.${productId}`] = importDetails[productId];
                    break;
                  }
                  case LawType.MINIMUM_WAGE: {
                    updates['policies.minWage'] = (pendingLaw.details as ISetMinWage).wage;
                    break;
                  }
                  case LawType.PEACE_TREATY: {
                    let target: IPeaceTreaty = (pendingLaw.details as IPeaceTreaty);

                    // TODO: Ensure both countries accept the treaty
                    // Delete War Record in DB where source === country._id AND target === target.country
                    await War.deleteOne({ source: country._id, target: target.country });
                    break;
                  }
                  case LawType.PRINT_MONEY: {
                    // Adds amount of money chosen, removes cost (0.005g per 1 CC) from treasury
                    let printDetails = pendingLaw.details as IPrintMoney;
                    let cost: number = roundMoney(printDetails.amount * 0.005);

                    if (!country.treasury['gold'] || country.treasury['gold'] < cost) {
                      pendingLaw.passed = false;
                      break;
                    }

                    updates[`treasury.${country.currency}`] = roundMoney((country.treasury[country.currency] ?? 0) + printDetails.amount);
                    updates[`treasury.gold`] = roundMoney(country.treasury['gold'] - cost);
                    break;
                  }
                  case LawType.VAT_TAX: {
                    let vatDetails = pendingLaw.details as IChangeVATTax;
                    let productId: number = Number.parseInt(Object.keys(vatDetails)[0]);
                    updates[`policies.taxes.vat.${productId}`] = vatDetails[productId];
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

          country.pastLaws.push(...country.pendingLaws.filter(law => law.passed !== undefined));
          country.pendingLaws = country.pendingLaws.filter(law => law.passed === undefined);

          return await country.updateOne({
            $set: {
              pendingLaws: country.pendingLaws,
              pastLaws: country.pastLaws,
              ...updates,
            },
          });
        }));
      });

      session.endSession();

      return res.status(200).json({ success: true });
    }
  } catch (err: any) {
    return res.status(500);
  }
}