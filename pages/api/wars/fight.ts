import Battle, { IBattle } from '@/models/Battle';
import User, { IAlert, IUser } from '@/models/User';
import War, { IWar } from '@/models/War';
import { buildLevelUpAlert } from '@/util/apiHelpers';
import { validateToken } from '@/util/auth';
import { connectToDB } from '@/util/mongo';
import { neededXP } from '@/util/ui';
import type { NextApiRequest, NextApiResponse } from 'next';

interface IFightRequest {
  battleId: string;
}

export enum BATTLE_SIDE {
  ATTACKING = 'attackers',
  DEFENDING = 'defenders',
}

// TODO: Take into account national buffs and debuffs
export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'POST': {
      // Ensure DB Conn
      await connectToDB();
      
      const { user_id } = validation_res;
      const { battleId } = JSON.parse(req.body) as IFightRequest;

      // Validate User Can Fight in Battle
      let user: IUser = await User.findOne({ _id: user_id }).exec();
      if (!user)
        return res.status(404).json({ error: 'User Not Found' });

      let battle: IBattle = await Battle.findOne({ _id: battleId }).exec();
      if (!battle)
        return res.status(404).json({ error: 'Battle Not Found' });
      
      let war: IWar = await War.findOne({ _id: battle.war }).exec();
      if (!war)
        return res.status(404).json({ error: 'War Not Found' });
      else if (![...war.sourceAllies, ...war.targetAllies].includes(user.country) && user.location !== battle.region)
        return res.status(400).json({ error: 'You Must Be Located In Battle Region To Fight' });

      // Figure out what side user is fighting on
      let side: BATTLE_SIDE;
      if (war.sourceAllies.includes(user.country))
        side = BATTLE_SIDE.ATTACKING;
      else
        side = BATTLE_SIDE.DEFENDING;

      // Calculate Damage
      // TODO: Check if opposing country is the natural enemy of your country
      let dmg: number = calculate_dmg(user.level, user.strength, user.militaryRank);

      // Save Damage to User
      let milRankInc: number = Math.floor(dmg * 0.05);

      let updates: { [key: string]: any } = { $inc: { xp: 1, totalDmg: dmg, militaryRank: milRankInc, health: -10 } };
      // TODO: Check for Damage Dealer, True Patriot acheivements
      if (user.country === battle.attacker || battle.defender) {
        updates['$inc'][`patriotDmg.${user.country}`] = dmg;
        if (user.xp + 1 >= neededXP(user.level)) {
          let alert = await buildLevelUpAlert(user.level + 1);
          updates['$inc']['level'] = 1;
          updates['$inc']['gold'] = 5;
          updates['$push'] = { alerts: alert };
        }
      }

      let updated = await user.updateOne(updates).exec();

      // Save Damage to Battle Stats and Recent Hits
      let recent = { userId: user._id, country: user.country, damage: dmg };
      updates = {
        $inc: { 'stats.totalDamage': dmg },
        $push: { [`stats.recentHits.${side}`]: { $each: [recent], $position: 0 } }, // Push to beginning of array
      };

      // Remove old hits to keep array small
      if (battle.stats.recentHits[side].length >= 10) {
        let recentsToRemove = battle.stats.recentHits[side].slice(9);
        updates['$pull'] = { [`stats.recentHits.${side}`]: { $each: recentsToRemove } };
      }

      if (!battle.stats[side])
        updates['$set'] = { [`stats.${side}`]: { [user._id]: { country: user.country, damage: dmg } } };
      else if (!battle.stats[side][user._id])
        updates['$set'] = { [`stats.${side}.${user._id}`]: { country: user.country, damage: dmg } };
      else
        updates['$inc'][`stats.${side}.${user._id}.damage`] = dmg;

      updated = await Battle.findOneAndUpdate({ _id: battleId }, updates).exec();
      if (updated)
        return res.status(200).json({ success: true, dmg, milRankInc });

      return res.status(500).json({ error: 'Something Went Wrong' });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

// TODO: Implement Weapon Bonuses
export function calculate_dmg(level: number, str: number, rank: number, ne: boolean = false): number {
  let base_dmg: number = (level * 5) + str;
  let ne_bonus: number = ne === true ? 1.1 : 1.0;
  let rank_bonus: number = 1 + (rank * 0.05);
  return Math.ceil(base_dmg * ne_bonus * rank_bonus);
}