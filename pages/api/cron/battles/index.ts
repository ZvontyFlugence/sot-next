import { IFighter } from '@/components/battles/BattleLink';
import Battle, { IBattle } from '@/models/Battle';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import User, { IAlert } from '@/models/User';
import { roundMoney } from '@/util/apiHelpers';
import { AlertTypes } from '@/util/constants';
import { connectToDB } from '@/util/mongo';
import type { NextApiRequest, NextApiResponse } from 'next';
import { BATTLE_SIDE } from '../../wars/fight';

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

          // Calculate Battle Heroes for both sides
          let attackerMax: number = Number.MIN_VALUE;
          let attackerBH: number = -1;
          let defenderMax: number = Number.MIN_VALUE;
          let defenderBH: number = -1;
          const battleHeroReduction = ((fighterId: string, fighter: IFighter, side: BATTLE_SIDE) => {
            switch (side) {
              case BATTLE_SIDE.ATTACKING: {
                if (fighter.damage > attackerMax) {
                  attackerMax = fighter.damage;
                  attackerBH = Number.parseInt(fighterId);
                }
              }
              case BATTLE_SIDE.DEFENDING: {
                if (fighter.damage > defenderMax) {
                  defenderMax = fighter.damage;
                  defenderBH = Number.parseInt(fighterId);
                }
              }
            }
          });

          Object.entries(battle.stats.attackers).forEach(([fighterId, fighter]: [string, IFighter]) => battleHeroReduction(fighterId, fighter, BATTLE_SIDE.ATTACKING));
          Object.entries(battle.stats.defenders).forEach(([fighterId, fighter]: [string, IFighter]) => battleHeroReduction(fighterId, fighter, BATTLE_SIDE.DEFENDING));

          // Award Battle Hero Achievements & Rewards
          if (attackerBH >= 0) {
            await User.updateOne(
              { _id: attackerBH },
              { $addToSet: { alerts: await buildBattleHeroAlert(battle.region, BATTLE_SIDE.ATTACKING) } }
            ).session(session);
          }

          if (defenderBH >= 0) {
            await User.updateOne(
              { _id: defenderBH },
              { $addToSet: { alerts: await buildBattleHeroAlert(battle.region, BATTLE_SIDE.DEFENDING) } },
            ).session(session);
          }          

          // Switch Region Owner if attacker won & transfer gold
          if (winner === battle.attacker) {
            let defender: ICountry = await Country.findOne({ _id: battle.defender }).session(session);
            let defenderRegions: IRegion[] = await Region.find({ owner: battle.defender });
            let goldAmnt: number = roundMoney(defender.treasury['gold'] / defenderRegions.length);
            await defender.updateOne({ $inc: { gold: 0 - goldAmnt } });
            await Country.updateOne({ _id: battle.attacker }, { $inc: { 'treasury.gold': goldAmnt } }, { session });
            await Region.updateOne({ _id: battle.region }, { $set: { owner: winner } }, { session });
          }

          return await battle.updateOne({ $set: { winner } }, { session });
        }));
      });

      await session.endSession();

      return res.status(200).json({ success: true });
    }
  } catch (err: any) {
    return res.status(500);
  }
}

async function buildBattleHeroAlert(regionId: number, side: BATTLE_SIDE): Promise<IAlert> {
  let region: IRegion = await Region.findOne({ _id: regionId }).exec();

  const { randomBytes } = await import('crypto');
  const buf = randomBytes(10);

  let alert: IAlert = {
    id: buf.toString('hex'),
    type: AlertTypes.BATTLE_HERO,
    read: false,
    message: `You have received a Battle Hero achievement for most damage for the ${side} in the Battle of ${region.name}`,
    timestamp: new Date(Date.now()),
  };

  return alert;
}