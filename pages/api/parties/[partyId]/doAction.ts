import Country, { ICountry } from '@/models/Country';
import Election, { ElectionType, ICandidate, IElection } from '@/models/Election';
import Party, { EconomicStance, IParty, SocialStance } from '@/models/Party';
import { PartyActions } from '@/util/actions';
import { validateToken } from '@/util/auth';
import { NextApiRequest, NextApiResponse } from 'next';

interface IPartyActionRequest {
  action: string,
  data: IUpdateLogo | IUpdateName | IUpdateStance | IEditMember | INominateCandidate | IUpdateColor
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

interface INominateCandidate extends IBaseParams {
  candidateId: number,
}

interface IEditMember extends IBaseParams {
  memberId: number,
  role: string,
}

interface IUpdateColor extends IBaseParams {
  color: string,
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
        case PartyActions.EDIT_MEMBER: {
          result = await edit_member(data as IEditMember);
          break;
        }
        case PartyActions.NOMINATE_CONGRESS: {
          result = await nominate_congress(data as INominateCandidate);
          break;
        }
        case PartyActions.NOMINATE_CP: {
          result = await nominate_cp(data as INominateCandidate);
          break;
        }
        case PartyActions.UPDATE_COLOR: {
          result = await update_color(data as IUpdateColor);
          break;
        }
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

// TODO: Handle Nominating Someone After A Nominee Was Already Selected
async function nominate_cp(data: INominateCandidate): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.president !== data?.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };
  else if (party.president !== data.candidateId)
    return { status_code: 400, payload: { success: false, error: 'Candidate Cannot Be Party President' } };
  else if (!party.members.includes(data.candidateId))
    return { status_code: 400, payload: { success: false, error: 'Candidate Must Be A Party Member' } };
  else if (party.cpCandidates.findIndex(can => can.id === data.candidateId) < 0)
    return { status_code: 400, payload: { success: false, error: 'Only Candidates May Be Nominated' } };

  let date: Date = new Date(Date.now());
  let query = {
    isActive: false,
    isCompleted: false,
    type: ElectionType.CountryPresident,
    typeId: party.country,
    month: date.getUTCDate() < 5 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1,
    year: date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear(),
  };
  
  let election: IElection = await Election.findOne(query).exec();
  if (!election)
    return { status_code: 404, payload: { success: false, error: 'Country President Election Not Found' } };
  else if (election.candidates.findIndex(can => can.id === data.candidateId) >= 0)
    return { status_code: 400, payload: { success: false, error: 'Candidate Is Already The Nominee' } };

  let prevCandidateIndex = election.candidates.findIndex(can => can.party === party.id);
  if (prevCandidateIndex !== -1) {
    election.candidates.splice(prevCandidateIndex, 1);
  }

  let candidate: ICandidate = party.cpCandidates.find(can => can.id === data.candidateId);
  election.candidates.push(candidate);
  let updatedElection = await election.save();
  if (updatedElection)
    return { status_code: 200, payload: { success: true, message: 'Candidate Nominated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function edit_member(data: IEditMember): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data.party_id }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.president !== data.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };
  else if (!party.members.includes(data.memberId))
    return { status_code: 400, payload: { success: false, error: 'User Is Not A Party Member' } };

  if (party.president === data.memberId && data.role !== 'president') {
    if (data.role === 'vp') {
      party.president = party.vp;
      party.vp = data.memberId;
    } else if (data.role === 'member') {
      party.president = party.vp;
      party.vp = -1;
    }
  } else if (party.vp === data.memberId && data.role !== 'vp') {
    if (data.role === 'president') {
      party.president = party.vp;
      party.vp = -1;
    } else if (data.role === 'member') {
      party.vp = -1;
    }
  } else if (data.role === 'president') {
    party.president = data.memberId;
  } else if (data.role === 'vp') {
    party.vp = data.memberId;
  }

  let updatedParty = await party.save();
  if (updatedParty)
    return { status_code: 200, payload: { success: true, message: 'Member Role Updated' } };
  
  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function nominate_congress(data: INominateCandidate): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data.party_id }).exec();
  if (!party)
    return { status_code: 200, payload: { success: false, message: 'Party Not Found' } };
  else if (party.president !== data?.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };
  else if (party.president === data.candidateId)
    return { status_code: 400, payload: { success: false, error: 'Candidate Cannot Be Party President' } };
  else if (!party.members.includes(data.candidateId))
    return { status_code: 400, payload: { success: false, error: 'Candidate Must Be A Party Member' } };
  else if (party.congressCandidates.findIndex(can => can.id === data.candidateId) < 0)
    return { status_code: 400, payload: { success: false, error: 'Only Candidates May Be Nominated' } };

  let country: ICountry = await Country.findOne({ _id: party.country }).exec();
  if (!country)
    return { status_code: 404, payload: { success: false, error: 'Congress Election Not Found' } };
  else if (country.government.president === data.candidateId)
    return { status_code: 400, payload: { success: false, error: 'Candidate Cannot Be Country President' } };

  let candidate: ICandidate = party.congressCandidates.find(can => can.id === data?.candidateId);
  if (!candidate)
    return { status_code: 404, payload: { success: false, error: 'Candidate Not Found' } };
  
  let date: Date = new Date(Date.now());
  let query = {
    isActive: false,
    isCompleted: false,
    type: ElectionType.Congress,
    typeId: candidate?.location,
    month: date.getUTCDate() < 25 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1,
    year: date.getUTCDate() > 5 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear(),
  };

  let election: IElection = await Election.findOne(query).exec();
  if (!election)
    return { status_code: 404, payload: { success: false, error: 'Congress Election Not Found' } };
  else if (election.candidates.findIndex(can => can.id === data.candidateId) >= 0)
    return { status_code: 400, payload: { success: false, error: 'Candidate Is Already A Nominee' } };

  election.candidates.push(candidate);
  let updatedElection = await election.save();
  if (updatedElection)
    return { status_code: 200, payload: { success: true, message: 'Candidate Nominated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_color(data: IUpdateColor): Promise<IPartyActionResponse> {
  let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.president !== data?.user_id)
    return { status_code: 403, payload: { success: false, error: 'Unauthorized' } };

  let updatedParty = await party.updateOne({ $set: { color: data.color } }).exec();
  if (updatedParty)
    return { status_code: 200, payload: { success: true, message: 'Party Color Updated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}