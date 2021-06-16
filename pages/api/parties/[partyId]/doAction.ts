import Party, { EconomicStance, IParty, SocialStance } from '@/models/Party';
import { PartyActions } from '@/util/actions';
import { validateToken } from '@/util/auth';
import { NextApiRequest, NextApiResponse } from 'next';

interface IPartyActionRequest {
  action: string,
  data: IUpdateLogo | IUpdateName | IUpdateStance
}

interface IPartyActionResponse {
  status_code: number,
  payload: {
    success: boolean,
    message?: string,
    error?: string,
  },
}

interface IBaseParams {
  user_id?: number,
  party_id?: number,
}

interface IUpdateLogo extends IBaseParams {
  image: string,
}

interface IUpdateName extends IBaseParams {
  name: string,
}

interface IUpdateStance extends IBaseParams {
  value: EconomicStance | SocialStance,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  let party_id: number;

  try {
    party_id = Number.parseInt(req.query.partyId as string);
  } catch (e: any) {
    return res.status(400).json({ error: 'Invalid Party ID' });
  }

  switch (req.method) {
    case 'POST': {
      const { action, data } = JSON.parse(req.body) as IPartyActionRequest;
      const { user_id } = validation_res;
      data.user_id = user_id;
      data.party_id = party_id;

      let result: IPartyActionResponse;

      switch (action) {
        case PartyActions.UPDATE_ECON: {
          result = await update_econ(data as IUpdateStance);
          break;
        }
        case PartyActions.UPDATE_LOGO: {
          result = await update_logo(data as IUpdateLogo);
          break;
        }
        case PartyActions.UPDATE_NAME: {
          result = await update_name(data as IUpdateName);
          break;
        }
        case PartyActions.UPDATE_SOC: {
          result = await update_soc(data as IUpdateStance);
          break;
        }
        default:
          return res.status(400).json({ error: 'Invalid Party Action' });
      }

      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function update_econ(data: IUpdateStance): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.president !== data?.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };

    let updatedParty = await party.updateOne({ $set: { economicStance: data.value as EconomicStance } }).exec();
    if (updatedParty)
      return { status_code: 200, payload: { success: true, message: 'Party Stance Updated' } };
  
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_logo(data: IUpdateLogo): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.president !== data?.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };
  else if (!data.image)
    return { status_code: 400, payload: { success: false, error: 'Invalid Base64 Image' } };

  let updatedParty = await party.updateOne({ $set: { image: data.image } }).exec();
  if (updatedParty)
    return { status_code: 200, payload: { success: true, message: 'Party Logo Updated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_name(data: IUpdateName): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.president !== data?.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };

    let updatedParty = await party.updateOne({ $set: { name: data.name } }).exec();
    if (updatedParty)
      return { status_code: 200, payload: { success: true, message: 'Party Name Updated' } };
  
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_soc(data: IUpdateStance): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.president !== data?.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };

    let updatedParty = await party.updateOne({ $set: { socialStance: data.value as SocialStance } }).exec();
    if (updatedParty)
      return { status_code: 200, payload: { success: true, message: 'Party Stance Updated' } };
  
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}