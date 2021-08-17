import { IFighter } from '@/components/battles/BattleLink';
import Battle, { IBattle } from '@/models/Battle';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import { roundMoney } from '@/util/apiHelpers';
import { connectToDB } from '@/util/mongo';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Validate GitHub Actions Secret Key
    const key = req.headers?.authorization.split(' ')[1];

    if (key === process.env.ACTIONS_KEY) {
      // Ensure DB Connection
      await connectToDB();

      // Look for all active but expired battles & process them
      let session = await Battle.startSession();

      await session.withTransaction(async () => {
        let date: Date = new Date(Date.now());
        let battles: IBattle[] = await Battle.find({ end: { $lte: date } });

        return await Promise.all(battles.map(async (battle: IBattle) => {
          let attackDmg: number = 0;
          let defenseDmg: number = battle.wall;

          const reduction = (accum: number, fighter: IFighter) => {
            return accum + fighter.damage;
          };

          attackDmg += Object.values(battle.stats.attackers).reduce(reduction, 0);
          defenseDmg += Object.values(battle.stats.defenders).reduce(reduction, 0);

          // Decide Battle Winners
          let winner: number;
          if (attackDmg > defenseDmg)
            winner = battle.attacker;
          else
            winner = battle.defender;

          // TODO: Calculate Battle Heroes for both sides
          // and award achievements + rewards

          // Switch Region Owner if attacker won & transfer gold
          if (winner === battle.attacker) {
            let defender: ICountry = await Country.findOne({ _id: battle.defender });
            let defenderRegions: IRegion[] = await Region.find({ owner: battle.defender });
            let goldAmnt: number = roundMoney(defender.treasury['gold'] / defenderRegions.length);
            await defender.updateOne({ $inc: { gold: 0 - goldAmnt } });
            await Country.updateOne({ _id: battle.attacker }, { $inc: { 'treasury.gold': goldAmnt } });
            await Region.updateOne({ _id: battle.region }, { $set: { owner: winner } });
          }

          // TODO: Move region residents to random neighboring region? Maybe unecessary

          return await battle.updateOne({ $set: { winner } });
        }));
      });

      session.endSession();

      return res.status(200).json({ success: true });
    }
  } catch (err: any) {
    return res.status(500);
  }
}