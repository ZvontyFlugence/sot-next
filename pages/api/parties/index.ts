import Party, { IParty } from "@/models/Party";
import User, { IUser } from "@/models/User";
import { ActionResult, defaultActionResult, roundMoney } from "@/util/apiHelpers";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";
import { IMap } from "../companies/doAction";

interface IGetPartiesRequest {
  country?: number;
}

interface ICreatePartyRequest {
  user_id?: number,
  name: string,
  economicStance: number,
  socialStance: number,
  color: string,
}

async function getParties(data: IGetPartiesRequest): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  let parties: IParty[];

  try {
    if (data.country) {
      parties = await Party.find({}).where({ country: data.country }).exec();
    } else {
      parties = await Party.find({}).exec();
    }

    ret.status_code = 200;
    ret.payload = { success: true, parties: parties ?? [] };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  // Ensure DB Conn
  await connectToDB();

  switch (req.method) {
    case 'GET': {
      let country: number | undefined;
      try {
        if (req.query.country) {
          country = Number.parseInt(req.query.country as string);
        }
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Country ID' });
      }

      let result: ActionResult = await getParties({ country });
      return res.status(200).json({ ...result });
    }
    case 'POST': {
      const { user_id } = validation_res;
      let data = JSON.parse(req.body) as ICreatePartyRequest;

      if (user_id) {
        data.user_id = user_id;
      } else {
        return res.status(400).json({ error: 'Invalid Field: `user_id`' });
      }

      let result: ActionResult = await createParty(data);
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function createParty(data: ICreatePartyRequest): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      let user: IUser = await User.findOne({ _id: data?.user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      } else if (roundMoney(user.gold) < 15) {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Gold';
        throw new Error(ret.payload.error);
      }

      // CHeck if party w/ same name exists
      let exists: IParty[] = await Party.find({ country: user.country, name: data.name });
      if (exists && exists.length > 0) {
        ret.status_code = 400;
        ret.payload.error = 'Party Name Already Taken';
        throw new Error(ret.payload.error);
      }

      // Create Party
      // Create Party
      let id = await Party.estimatedDocumentCount() + 1;
      let newParty = new Party({
        _id: id,
        name: data.name,
        economicStance: data.economicStance,
        socialStance: data.socialStance,
        president: user._id,
        members: [user._id],
        country: user.country,
        color: data.color,
      });

      newParty.$session(session);
      let savedParty: IParty = await newParty.save();
      if (!savedParty) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      // Subtract User Gold
      let userUpdates: IMap = { $inc: { gold: -15 }, $set: { party: id } };
      let updatedUser = await user.updateOne(userUpdates);
      if (!updatedUser) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 201;
      ret.payload = { success: true, message: 'Political Party Created!', partyId: savedParty._id };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}