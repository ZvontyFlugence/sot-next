import Country, { ICountry } from '@/models/Country';
import Election, { ElectionType, ICandidate, IElection } from '@/models/Election';
import Party, { EconomicStance, IParty, SocialStance } from '@/models/Party';
import { PartyActions } from '@/util/actions';
import { ActionResult, defaultActionResult } from '@/util/apiHelpers';
import { validateToken } from '@/util/auth';
import { connectToDB } from '@/util/mongo';
import { NextApiRequest, NextApiResponse } from 'next';
import { IMap } from '../../companies/doAction';

interface IPartyActionRequest {
  action: string,
  data: IUpdateLogo | IUpdateName | IUpdateStance | IEditMember | INominateCandidate | IUpdateColor
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
      // Ensure DB Connection
      await connectToDB();

      const { action, data } = JSON.parse(req.body) as IPartyActionRequest;
      const { user_id } = validation_res;
      data.user_id = user_id;
      data.party_id = party_id;

      let result: ActionResult;

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

async function update_econ(data: IUpdateStance): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  
  try {
    let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data?.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }

    let economicStance: EconomicStance = data.value as EconomicStance;
    if (!economicStance) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Economic Stance';
      throw new Error(ret.payload.error);
    }

    let updatedParty = await party.updateOne({ $set: { economicStance } }).exec();
    if (updatedParty)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Party Stance Updated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function update_logo(data: IUpdateLogo): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data?.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    } else if (!data.image) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Base64 Image';
      throw new Error(ret.payload.error);
    }
  
    let updatedParty = await party.updateOne({ $set: { image: data.image } }).exec();
    if (!updatedParty)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Party Logo Updated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function update_name(data: IUpdateName): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data?.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }

    let exists = await Party.find({ country: party.country, name: data.name }).exec();
    if (exists && exists.length > 0) {
      ret.status_code = 400;
      ret.payload.error = 'Party Name Already Taken';
      throw new Error(ret.payload.error);
    }

    let updatedParty = await party.updateOne({ $set: { name: data.name } }).exec();
    if (updatedParty)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Party Name Updated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function update_soc(data: IUpdateStance): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data?.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }
    
    let socialStance: SocialStance = data.value as SocialStance;
    if (!socialStance) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Social Stance';
      throw new Error(ret.payload.error);
    }

    let updatedParty = await party.updateOne({ $set: { socialStance } }).exec();
    if (updatedParty)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Party Stance Updated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function nominate_cp(data: INominateCandidate): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data?.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    } else if (party.president !== data.candidateId) {
      ret.status_code = 400;
      ret.payload.error = 'Candidate Cannot Be Party President';
      throw new Error(ret.payload.error);
    } else if (!party.members.includes(data.candidateId)) {
      ret.status_code = 400;
      ret.payload.error = 'Candidate Must Be A Party Member';
      throw new Error(ret.payload.error);
    }
    
    let candidate: ICandidate = party.cpCandidates.find(can => can.id === data.candidateId)
    if (!candidate) {
      ret.status_code = 404;
      ret.payload.error = 'Candidate Not Found';
      throw new Error(ret.payload.error);
    }

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
    if (!election) {
      ret.status_code = 404;
      ret.payload.error = 'Country President Election Not Found';
      throw new Error(ret.payload.error);
    } else if (election.candidates.findIndex(can => can.id === data.candidateId) >= 0) {
      ret.status_code = 400;
      ret.payload.error = 'Candidate Is Already The Nominee';
      throw new Error(ret.payload.error);
    }

    let updates: IMap = {};

    let prevCandidateIndex = election.candidates.findIndex(can => can.party === party.id);
    if (prevCandidateIndex !== -1) {
      updates['$pull'] = { candidates: { party: party.id } };
    }

    updates['$addToSet'] = { candidates: candidate };
    let updatedElection = await election.updateOne(updates).exec();
    if (!updatedElection)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'CP Candidate Nominated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function edit_member(data: IEditMember): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let party: IParty = await Party.findOne({ _id: data.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    } else if (!party.members.includes(data.memberId)) {
      ret.status_code = 400;
      ret.payload.error = 'User Is Not A Party Member';
      throw new Error(ret.payload.error);
    }

    let updates: IMap = {};
    if (party.president === data.memberId && data.role !== 'president') {
      if (data.role === 'vp')
        updates = { $set: { president: party.vp, [data.role]: data.memberId } };
      else if (data.role === 'member')
        updates = { $set: { president: party.vp, vp: -1 } };
    } else if (party.vp === data.memberId && data.role !== 'vp') {
      if (data.role === 'president')
        updates = { $set: { [data.role]: party.vp, vp: -1 } };
      else if (data.role === 'member')
        updates = { $set: { vp: -1 } };
    } else if (data.role === 'president' || data.role === 'vp') {
      updates = { $set: { [data.role]: data.memberId } };
    }

    if (!updates['$set']) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Role Update';
      throw new Error(ret.payload.error);
    }

    let updatedParty = await party.updateOne(updates).exec();
    if (!updatedParty) {
      throw new Error(ret.payload.error);
    }

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Member Role Updated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function nominate_congress(data: INominateCandidate): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let party: IParty = await Party.findOne({ _id: data.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data?.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    } else if (party.president === data.candidateId) {
      ret.status_code = 400;
      ret.payload.error = 'Candidate Cannot Be Party President';
      throw new Error(ret.payload.error);
    } else if (!party.members.includes(data.candidateId)) {
      ret.status_code = 400;
      ret.payload.error = 'Candidate Must Be A Party Member';
      throw new Error(ret.payload.error);
    }
    
    let candidate: ICandidate = party.congressCandidates.find(can => can.id === data?.candidateId);
    if (!candidate) {
      ret.status_code = 404;
      ret.payload.error = 'Candidate Not Found';
      throw new Error(ret.payload.error);
    }

    let country: ICountry = await Country.findOne({ _id: party.country }).exec();
    if (!country) {
      ret.status_code = 404;
      ret.payload.error = 'Party Country Not Found';
      throw new Error(ret.payload.error);
    } else if (country.government.president === data.candidateId) {
      ret.status_code = 400;
      ret.payload.error = 'Candidate Cannot Be Country President';
      throw new Error(ret.payload.error);
    }

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
    if (!election) {
      ret.status_code = 404;
      ret.payload.error = 'Congress Election Not Found';
      throw new Error(ret.payload.error);
    } else if (election.candidates.findIndex(can => can.id === data.candidateId) >= 0) {
      ret.status_code = 400;
      ret.payload.error = 'Candidate Is Already A Nominee';
      throw new Error(ret.payload.error);
    }

    let updates: IMap = { '$addToSet': { candidates: candidate } };
    let updatedElection = await election.updateOne(updates).exec();
    if (!updatedElection)
      throw new Error(ret.payload.error);
    
    ret.status_code = 200;
    ret.payload = { success: true, message: 'Congress Candidate Nominated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function update_color(data: IUpdateColor): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  
  try {
    let party: IParty = await Party.findOne({ _id: data?.party_id }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president !== data?.user_id) {
      ret.status_code = 403;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }

    if (data.color.indexOf('#') !== 0 || data.color.length !== 7) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Hex Color Format';
      throw new Error(ret.payload.error);
    }
  
    let updatedParty = await party.updateOne({ $set: { color: data.color } }).exec();
    if (!updatedParty)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Party Color Updated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}