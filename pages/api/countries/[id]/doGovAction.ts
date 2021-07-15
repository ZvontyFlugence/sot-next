import { GovActions } from '@/util/actions';
import { validateToken } from '@/util/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { LawType } from '@/util/apiHelpers';
import Country, { IChangeIncomeTax, ICountry, ILaw } from '@/models/Country';
import { data } from 'autoprefixer';
import User, { IAlert } from '@/models/User';

interface IGovActionRequest {
  action: string,
  data: IProposeLaw | IResign
}

interface IGovActionResult {
  status_code: number,
  payload: {
    success: boolean,
    error?: string,
    message?: string,
  },
}

interface IBaseParams {
  user_id?: number,
  country_id?: number,
}

interface IProposeLaw extends IBaseParams {
  lawType: LawType,
  lawDetails?: IChangeIncomeTax
}

interface IResign extends IBaseParams {}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  let country_id: number;

  try {
    country_id = Number.parseInt(req.query.id as string);
  } catch (e: any) {
    return res.status(400).json({ error: 'Invalid Country ID' });
  }

  switch (req.method) {
    case 'POST': {
      const { action, data } = JSON.parse(req.body) as IGovActionRequest;

      if (!data.user_id)
        data.user_id = validation_res.user_id;

      data.country_id = country_id;

      switch (action) {
        case GovActions.PROPOSE_LAW: {
          let result = await propose_law(data as IProposeLaw);
          return res.status(result.status_code).json(result.payload);
        }
        case GovActions.RESIGN: {
          let result = await resign(data as IResign);
          return res.status(result.status_code).json(result.payload);
        }
        default:
          return res.status(400).json({ error: 'Invalid Congress Action' });
      }
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function propose_law(data: IProposeLaw): Promise<IGovActionResult> {
  let country: ICountry = await Country.findOne({ _id: data.country_id }).exec();
  if (!country)
    return { status_code: 404, payload: { success: false, error: 'Country Not Found' } };
  
  // Validate User is in Government
  const { government } = country;
  if (data.user_id !== government.president && data.user_id !== government.vp &&
    government.congress.findIndex(mem => mem.id === data.user_id) === -1 && !Object.values(government.cabinet).includes(data.user_id))
    return { status_code: 400, payload: { success: false, error: 'You\'re Not A Government Member' } };

  // Ensure if User is a Cabinet member, User holds the MoT (Treasury) title
  if (Object.values(government.cabinet).includes(data.user_id) && data.user_id !== government.cabinet.mot)
    return { status_code: 400, payload: { success: false, error: 'You\'re Not Allowed To Propose This Law' } };

  let res: IGovActionResult;

  switch (data.lawType) {
    case LawType.INCOME_TAX: {
      res = await change_income_tax(data.user_id, data.country_id, data.lawDetails as IChangeIncomeTax);
      break;
    }
    default:
      return { status_code: 400, payload: { success: false, error: 'Unknown Law Type' } };
  }

  if (res?.status_code === 200) {
    // Send Alert to All Gov Members that a new law has been proposed
    let govMembers: number[] = [
      country.government.president,
      country.government.vp,
      ...Object.values(country.government.cabinet),
      ...government.congress.map(mem => mem.id)
    ];

    const alert: IAlert = {
      type: 'LAW_PROPOSED',
      read: false,
      message: 'A New Law Has Been Proposed!',
      timestamp: new Date(Date.now()),
    };

    await User.updateMany({ _id: { $in: govMembers } }, { $push: { alerts: alert } }).exec();
  }

  return res;
}

async function resign(data: IResign): Promise<IGovActionResult> {

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function change_income_tax(userId: number, countryId: number, lawDetails: IChangeIncomeTax): Promise<IGovActionResult> {
  let now = new Date(Date.now());

  // Generate Law ID
  const { randomBytes } = await import('crypto');
  let buffer = await randomBytes(10);

  const newLaw: ILaw = {
    id: buffer.toString('hex'),
    type: LawType.INCOME_TAX,
    details: lawDetails,
    proposed: now,
    proposedBy: userId,
    expires: new Date(now.setUTCDate(now.getUTCDate() + 1)),  // 24 hrs from proposed time
    votes: [],
  };

  let updated = await Country.updateOne({ _id: countryId }, { $push: { pendingLaws: newLaw } }).exec()
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Change Income Tax Law Proposed' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}