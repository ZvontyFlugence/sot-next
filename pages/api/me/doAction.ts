import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";
import { UserActions } from '@/util/actions';
import User, { IUser, IUserUpdates } from "@/models/User";
import { neededXP } from "@/util/ui";
import { buildLevelUpAlert } from "@/util/apiHelpers";
import { connectToDB } from "@/util/mongo";

interface IUserActionResult {
  status_code: number,
  payload : {
    success: boolean,
    error?: string,
    message?: string,
  },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(401).json({ error: validation_res.error });
  }

  switch (req.method) {
    case 'POST': {
      const { user_id } = validation_res;
      const { action } = JSON.parse(req.body);
      let result: IUserActionResult;

      // Ensure DB Conn
      await connectToDB();

      switch (action) {
        case UserActions.HEAL: {
          result = await heal(user_id);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.TRAIN: {
          result = await train(user_id);
          return res.status(result.status_code).json(result.payload);
        }
        default:
          return res.status(400).json({ error: 'Unhandled User Action' });
      }
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function heal(user_id: number): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (user.health >= 100) {
    return { status_code: 400, payload: { success: false, error: 'Health Already At Maximum' } };
  }

  let updates: IUserUpdates = {
    health: Math.min(user.health + 50, 100),
  };

  let updated: IUser = await user.updateOne({ $set: { ...updates } }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function train(user_id: number): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (user.health < 10) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Health' } };
  } else if (new Date(user.canTrain) > new Date(Date.now())) {
    return { status_code: 400, payload: { success: false, error: 'You\'ve Already Trained Today' } };
  }

  let updates: IUserUpdates = {
    health: user.health - 10,
    strength: user.strength + 1,
    xp: user.xp + 1,
    canTrain: new Date(new Date().setUTCHours(24, 0, 0, 0)),
  };

  if (updates.xp >= neededXP(user.level)) {
    updates.level = user.level + 1;
    updates.gold = user.gold + 5.00;
    // Build Alert
    updates.alerts = [...user.alerts, buildLevelUpAlert(updates.level)];
  }

  let updated = await user.updateOne({ $set: { ...updates } }).exec();

  if (updated) {
    return { status_code: 200, payload: { success: true, message: 'Received +1 Strength and +1 XP' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}