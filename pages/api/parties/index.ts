import Party, { IParty } from "@/models/Party";
import User, { IUser } from "@/models/User";
import { roundMoney } from "@/util/apiHelpers";
import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

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

      let result: IGetPartiesResponse = await getParties({ country });
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

      let result: ICreatePartyResponse = await createParty(data);
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

interface IGetPartiesRequest {
  country?: number,
}

interface IGetPartiesResponse {
  parties?: IParty[]
}

async function getParties(data: IGetPartiesRequest): Promise<IGetPartiesResponse> {
  let parties: IParty[];

  if (data.country) {
    parties = await Party.find({}).where({ country: data.country }).exec();
  } else {
    parties = await Party.find({}).exec();
  }

  return { parties: parties ?? [] };
}

interface ICreatePartyRequest {
  user_id?: number,
  name: string,
  economicStance: number,
  socialStance: number,
  color: string,
}

interface ICreatePartyResponse {
  status_code: number,
  payload: {
    success: boolean,
    partyId?: number,
    message?: string,
    error?: string,
  },
}

async function createParty(data: ICreatePartyRequest): Promise<ICreatePartyResponse> {
  let user: IUser = await User.findOne({ _id: data?.user_id });
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (roundMoney(user.gold) < 15) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };
  }

  // Check if party with same name exists
  let existingName: IParty = await Party.findOne({ name: data.name }).where({ country: user.country }).exec();
  if (existingName)
    return { status_code: 400, payload: { success: false, error: 'Party Name Already Taken' } };

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

  // Subtract user gold
  let userUpdates = { gold: roundMoney(user.gold - 15), party: id };
  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (!updatedUser) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
  }

  let savedParty: IParty = await newParty.save();
  if (savedParty)
    return { status_code: 201, payload: { success: true, partyId: savedParty._id, message: 'Political Party Created!' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}