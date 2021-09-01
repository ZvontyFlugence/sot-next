import { GovActions } from '@/util/actions';
import { validateToken } from '@/util/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { LawType } from '@/util/apiHelpers';
import Country, { IAlly, IChangeImportTax, IChangeIncomeTax, IChangeVATTax, ICountry, IEmbargo, IGovernment, IImpeachCP, ILaw, ILawVote, IPeaceTreaty, IPrintMoney, ISetMinWage } from '@/models/Country';
import User, { IAlert, IUser } from '@/models/User';
import War, { IWar } from '@/models/War';
import Region, { IRegion } from '@/models/Region';
import Battle, { IBattle } from '@/models/Battle';

interface IGovActionRequest {
  action: string;
  data: IProposeLaw | IResign;
}

interface IGovActionResult {
  status_code: number;
  payload: {
    success: boolean;
    error?: string;
    message?: string;
  };
}

interface IBaseParams {
  user_id?: number;
  country_id?: number;
}

interface IProposeLaw extends IBaseParams {
  lawType: LawType;
  lawDetails?: (
    IChangeIncomeTax | IChangeImportTax | IChangeVATTax | IEmbargo | IAlly | IImpeachCP |
    ISetMinWage | IPrintMoney
  );
}

interface IVoteLaw extends IBaseParams {
  lawId: string;
  vote: 'yes' | 'no' | 'abstain';
}

interface IResign extends IBaseParams {}

interface IAttackRegion extends IBaseParams {
  warId: string;
  targetCountry: number;
  targetRegion: number;
}

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
        case GovActions.ATTACK: {
          let result = await attack_region(data as IAttackRegion);
          return res.status(result.status_code).json(result.payload);
        }
        case GovActions.PROPOSE_LAW: {
          let result = await propose_law(data as IProposeLaw);
          return res.status(result.status_code).json(result.payload);
        }
        case GovActions.RESIGN: {
          let result = await resign(data as IResign);
          return res.status(result.status_code).json(result.payload);
        }
        case GovActions.VOTE_LAW: {
          let result = await vote(data as IVoteLaw);
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

  // Validation based on law type
  let isValid = validate_law(data, government);
  if (!isValid)
    return { status_code: 400, payload: { success: false, error: 'You\'re Not Allowed To Propose This Law' } };

  let res: IGovActionResult;

  switch (data.lawType) {
    case LawType.ALLIANCE: {
      let sourceRes = await create_new_law(data);
      let targetRes = await create_new_law({
        ...data,
        country_id: (data.lawDetails as IAlly).country,
        lawDetails: { ...data.lawDetails, country: data.country_id },
      });

      if (sourceRes?.status_code === 200 && targetRes?.status_code === 200) {
        let targetCountry: ICountry = await Country.findOne({ _id: (data.lawDetails as IAlly).country }).exec();
        let { government: target } = targetCountry;
        // Send Alert to All Gov Members for both countries that a new law has been proposed
        let govMembers: number[] = [
          government.president,
          government.vp,
          ...Object.values(government.cabinet),
          ...government.congress.map(mem => mem.id),
          target.president,
          target.vp,
          ...Object.values(target.cabinet),
          ...target.congress.map(mem => mem.id),
        ];

        const alert: IAlert = {
          type: 'LAW_PROPOSED',
          read: false,
          message: 'A New Law Has Been Proposed!',
          timestamp: new Date(Date.now()),
        };

        await User.updateMany({ _id: { $in: govMembers } }, { $push: { alerts: alert } }).exec();
      }

      res = sourceRes;
      break;
    }
    case LawType.PEACE_TREATY: {
      // Create Treaty law in both countries (source + target)
      let sourceRes = await create_new_law(data);
      let targetRes = await create_new_law({
        ...data,
        country_id: (data.lawDetails as IPeaceTreaty).country,
        lawDetails: { ...data.lawDetails, country: data.country_id },
      });

      if (sourceRes?.status_code === 200 && targetRes?.status_code === 200) {
        let targetCountry: ICountry = await Country.findOne({ _id: (data.lawDetails as IPeaceTreaty).country }).exec();
        let { government: target } = targetCountry;
        // Send Alert to All Gov Members for both countries that a new law has been proposed
        let govMembers: number[] = [
          government.president,
          government.vp,
          ...Object.values(government.cabinet),
          ...government.congress.map(mem => mem.id),
          target.president,
          target.vp,
          ...Object.values(target.cabinet),
          ...target.congress.map(mem => mem.id),
        ];

        const alert: IAlert = {
          type: 'LAW_PROPOSED',
          read: false,
          message: 'A New Law Has Been Proposed!',
          timestamp: new Date(Date.now()),
        };

        await User.updateMany({ _id: { $in: govMembers } }, { $push: { alerts: alert } }).exec();
      }
      
      res = sourceRes;
      break;
    }
    case LawType.DECLARE_WAR:
    case LawType.EMBARGO:
    case LawType.IMPEACH_CP:
    case LawType.INCOME_TAX:
    case LawType.IMPORT_TAX:
    case LawType.MINIMUM_WAGE:
    case LawType.PRINT_MONEY:
    case LawType.VAT_TAX: {
      res = await create_new_law(data);

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

      break;
    }
    default:
      return { status_code: 400, payload: { success: false, error: 'Unknown Law Type' } };
  }

  return res;
}

// TODO: Implement
async function resign(data: IResign): Promise<IGovActionResult> {
  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function vote(data: IVoteLaw): Promise<IGovActionResult> {
  let country: ICountry = await Country.findOne({ _id: data.country_id }).exec();
  if (!country)
    return { status_code: 404, payload: { success: false, error: 'Country Not Found' } };
  
  // Validate User is in Government
  const { government } = country;
  if (data.user_id !== government.president && data.user_id !== government.vp &&
    government.congress.findIndex(mem => mem.id === data.user_id) === -1 && !Object.values(government.cabinet).includes(data.user_id))
    return { status_code: 400, payload: { success: false, error: 'You\'re Not A Government Member' } };

  let lawIndex: number = country.pendingLaws.findIndex(law => law.id === data.lawId);
  if (lawIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Law Proposal Not Found' } };

  let voteObj: ILawVote = { id: data.user_id, choice: data.vote };

  let updated = await country.updateOne({ $push: { [`pendingLaws.${lawIndex}.votes`]: voteObj } }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Law Proposal Vote Submitted' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function create_new_law(data: IProposeLaw): Promise<IGovActionResult> {
  let now = new Date(Date.now());
  let tomorrow = new Date(new Date(now).setUTCDate(now.getUTCDate() + 1));

  // Generate Law ID
  const { randomBytes } = await import('crypto');
  let buffer = await randomBytes(10);

  const newLaw: ILaw = {
    id: buffer.toString('hex'),
    type: data.lawType,
    details: data.lawDetails,
    proposed: now,
    proposedBy: data.user_id,
    expires: tomorrow,  // 24 hrs from proposed time
    votes: [],
  };

  let updated = await Country.updateOne({ _id: data.country_id }, { $addToSet: { pendingLaws: newLaw } }).exec()
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Law Proposed' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function attack_region(data: IAttackRegion): Promise<IGovActionResult> {
  let war: IWar = await War.findOne({ _id: data.warId }).exec();
  if (!war)
    return { status_code: 404, payload: { success: false, error: 'War Not Found' } };
  else if (!war?.sourceAllies.includes(data.country_id) && !war?.targetAllies.includes(data.country_id))
    return { status_code: 400, payload: { success: false, error: 'Country Not A War Participant' } };
  else if (!war?.sourceAllies.includes(data.targetCountry) && !war?.targetAllies.includes(data.targetCountry))
    return { status_code: 400, payload: { success: false, error: 'Target Country Not A War Participant' } };

  let region: IRegion = await Region.findOne({ _id: data.targetRegion, owner: data.targetCountry }).exec();
  if (!region)
    return { status_code: 404, payload: { success: false, error: 'Region Not Found' } };

  // Check if existing battle is in region
  let now = new Date(Date.now());
  let existing = await Battle.findOne({
    region: data.targetRegion,
    end: { $lte: now },
    winner: { $exists: false }
  }).exec();

  if (existing)
    return { status_code: 400, payload: { success: false, error: 'Battle Already Active In Region' } };

  // Use residence over location, so players dont need to be in region before attack to have a decent wall
  // Also makes residence more useful and to keep country citizens spread over entire country (residence-wise)
  // This allows Electoral Systems to make more sense, since all citizens won't sit in a single region.
  let regionCitizens: IUser[] = await User.find({ residence: data.targetRegion, country: data.targetCountry }).exec();
  let tomorrow = new Date(new Date(now).setUTCDate(now.getUTCDate() + 1));

  // Create Battle
  let battle: IBattle = new Battle({
    war: data.warId,
    attacker: data.country_id,
    defender: data.targetCountry,
    region: data.targetRegion,
    wall: 100 * regionCitizens.length,
    start: now,
    end: tomorrow,
  });

  let created = await battle.save();
  if (created) {
    // Save to War Battles List
    let updated = await war.updateOne({ $push: { battles: created._id } })
    if (updated)
      return { status_code: 200, payload: { success: true, message: 'Battle Started' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

function validate_law(data: IProposeLaw, government: IGovernment): boolean {
  switch (data.lawType) {
    case LawType.ALLIANCE:
      // Ensure if User is a Cabinet member, User is NOT the MoT
      return !(Object.values(government.cabinet).includes(data.user_id) && data.user_id === government.cabinet.mot);
    case LawType.DECLARE_WAR:
      // Ensure User is CP, vCP, or MoD
      return data.user_id === government.president || data.user_id === government.vp || data.user_id === government.cabinet.mod;
    case LawType.EMBARGO:
      // Ensure if User is a Cabinet member, User holds the MoT (Treasury) or MoFA (Foreign Affairs) title
      return !(Object.values(government.cabinet).includes(data.user_id) && data.user_id !== government.cabinet.mofa && data.user_id !== government.cabinet.mot);
    case LawType.IMPEACH_CP:
      // User must be in congress or VP
      return government.congress.map(mem => mem.id).includes(data.user_id) || data.user_id === government.vp;
    case LawType.PEACE_TREATY:
      // Ensure USer is CP, vCP, or MoFA
      return data.user_id === government.president || data.user_id === government.vp || data.user_id === government.cabinet.mofa;
    case LawType.IMPORT_TAX:
    case LawType.INCOME_TAX:
    case LawType.MINIMUM_WAGE:
    case LawType.PRINT_MONEY:
    case LawType.VAT_TAX:
      // Ensure if User is a Cabinet member, User holds the MoT (Treasury) title
      return !(Object.values(government.cabinet).includes(data.user_id) && data.user_id !== government.cabinet.mot);
    default:
      return false;
  }
}