import { validateToken } from '@/util/auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { UserActions } from '@/util/actions';
import User, { IAlert, IMsg, IThread, IUser, IUserUpdates, IWalletItem } from '@/models/User';
import { neededXP } from '@/util/ui';
import { ActionResult, buildLevelUpAlert, defaultActionResult, findVote, getDistance, IItem, roundMoney } from '@/util/apiHelpers';
import { connectToDB } from '@/util/mongo';
import Company, { ICompany, IEmployee, IFunds } from '@/models/Company';
import Region, { IRegion } from '@/models/Region';
import Country, { ElectionSystem, ICountry } from '@/models/Country';
import Shout, { IShout } from '@/models/Shout';
import bcrypt from 'bcrypt';
import Newspaper, { INewspaper } from '@/models/Newspaper';
import Party, { IParty } from '@/models/Party';
import Election, { ECVote, ElectionType, ICandidate, IElection } from '@/models/Election';
import { ObjectId } from 'mongoose';
import { AlertTypes } from '@/util/constants';
import { IMap } from '../companies/doAction';

interface IRequestBody {
  action: string;
  data?: IApplyJobParams | IHandleAlertParams | ISendFRParams | IBuyItemParams | ICreateShoutParams |
    IHandleShoutParams | IUpdateUsernameParams | IUpdatePwParams | ITravelParams | IGiftParams |
    IUpdateDescParams | IDonateParams | ICreateThreadParams | IHandleThread | ISendMsg | IRunForOffice |
    ICreateNewspaper | ILikeArticle | ISubscribeNews | IHandleVote;
}

interface IApplyJobParams {
  user_id?: number;
  company_id: number;
  job_id: string;
}

interface IHandleAlertParams {
  user_id?: number;
  alert_id: string;
}

interface ISendFRParams {
  user_id?: number;
  profile_id: number;
}

interface IBuyItemParams {
  user_id?: number;
  company_id: number;
  offer_id: string;
  quantity: number;
}

interface ICreateShoutParams {
  user_id?: number;
  shout: {
    scope: 'global' | 'country' | 'party' | 'unit';
    scope_id: number;
    author: number;
    message: string;
  };
}

interface IHandleShoutParams {
  user_id?: number;
  shout_id: number;
}

interface IUpdateUsernameParams {
  user_id?: number;
  username: string;
}

interface IUpdatePwParams {
  user_id?: number;
  currPw: string;
  newPw: string;
}

interface ITravelParams {
  user_id?: number;
  region_id?: number;
}

interface IUploadImageParams {
  user_id?: number;
  image: any;
}

interface IUpdateDescParams {
  user_id?: number;
  desc: string;
}

interface IDonateParams {
  user_id?: number;
  profile_id: number;
  gold?: number;
  funds?: {
    currency: string;
    amount: number;
  };
}

interface IGiftParams {
  user_id?: number;
  profile_id: number;
  items: IItem[];
}

interface ICreateThreadParams {
  user_id?: number;
  participants: number[];
  subject: string;
  message: string;
  timestamp: Date;
}

interface IHandleThread {
  user_id?: number;
  thread_id: string;
}

interface ISendMsg extends IHandleThread {
  message: string;
  timestamp: Date;
}

interface ICreateNewspaper {
  user_id?: number;
  name: string;
}

interface ILikeArticle {
  user_id?: number;
  newsId: number;
  articleId: string;
}

interface ISubscribeNews {
  user_id?: number;
  newsId: number;
}

interface IRunForOffice {
  user_id?: number;
  partyId: number;
}

interface IHandlePartyMembership {
  user_id?: number;
  partyId: number;
}

interface IHandleVote {
  user_id?: number;
  candidate: number;
  election: ObjectId;
  location: number;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (!validation_res || validation_res.error) {
    return res.status(401).json({ error: validation_res?.error || 'Unauthorized?' });
  }

  switch (req.method) {
    case 'POST': {
      const { user_id } = validation_res;
      const { action, data } = JSON.parse(req.body) as IRequestBody;
      
      if (data)
        data.user_id = user_id;

      let result: ActionResult;

      // Ensure DB Conn
      await connectToDB();

      switch (action) {
        case UserActions.ACCEPT_FR: {
          result = await accept_fr(data as IHandleAlertParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.APPLY_JOB: {
          result = await apply_for_job(data as IApplyJobParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.BUY_ITEM: {
          result = await buy_item(data as IBuyItemParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.COLLECT_REWARDS: {
          result = await collect_rewards(user_id);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.CREATE_NEWS: {
          result = await create_news(data as ICreateNewspaper);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.CREATE_THREAD: {
          result = await create_thread(data as ICreateThreadParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.DELETE_ALERT: {
          result = await delete_alert(data as IHandleAlertParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.DELETE_THREAD: {
          result = await delete_thread(data as IHandleThread);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.DONATE: {
          result = await donate_funds(data as IDonateParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.GIFT: {
          result = await gift_items(data as IGiftParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.HEAL: {
          result = await heal(user_id);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.JOIN_PARTY: {
          result = await join_party(data as IHandlePartyMembership);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.LEAVE_PARTY: {
          result = await leave_party(data as IHandlePartyMembership);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.LIKE_ARTICLE: {
          result = await like_article(data as ILikeArticle);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.LIKE_SHOUT: {
          result = await like_shout(data as IHandleShoutParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.MOVE_RESIDENCE: {
          result = await move_residence(data as ITravelParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.READ_ALERT: {
          result = await read_alert(data as IHandleAlertParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.READ_THREAD: {
          result = await read_thread(data as IHandleThread);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.RUN_FOR_CONGRESS: {
          result = await run_for_congress(data as IRunForOffice);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.RUN_FOR_CP: {
          result = await run_for_cp(data as IRunForOffice);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.SEND_FR: {
          result = await send_fr(data as ISendFRParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.SEND_MSG: {
          result = await send_msg(data as ISendMsg);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.SEND_SHOUT: {
          result = await send_shout(data as ICreateShoutParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.SUBSCRIBE: {
          result = await subscribe_news(data as ISubscribeNews);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.TRAIN: {
          result = await train(user_id);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.TRAVEL: {
          result = await travel(data as ITravelParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UNLIKE_ARTICLE: {
          result = await like_article(data as ILikeArticle);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UNLIKE_SHOUT: {
          result = await unlike_shout(data as IHandleShoutParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UNSUBSCRIBE: {
          result = await subscribe_news(data as ISubscribeNews);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UPDATE_DESC: {
          result = await update_desc(data as IUpdateDescParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UPDATE_NAME: {
          result = await update_username(data as IUpdateUsernameParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UPDATE_PW: {
          result = await update_password(data as IUpdatePwParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UPLOAD_PFP: {
          result = await upload(data as IUploadImageParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.VOTE: {
          result = await vote(data as IHandleVote);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.WORK: {
          result = await work(user_id);
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

async function heal(user_id: number): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (user.health >= 100) {
    return { status_code: 400, payload: { success: false, error: 'Health Already At Maximum' } };
  } else if (new Date(user.canHeal) > new Date(Date.now())) {
    return { status_code: 400, payload: { success: false, error: 'You\'ve Healed Already Today' } };
  }

  let updates: IUserUpdates = {
    health: Math.min(user.health + 50, 100),
    canHeal: new Date(new Date().setUTCHours(24, 0, 0, 0)),
  };

  let updated: IUser = await user.updateOne({ $set: { ...updates } }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function train(user_id: number): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (user.health < 10) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Health' } };
  } else if (new Date(user.canTrain) > new Date(Date.now())) {
    return { status_code: 400, payload: { success: false, error: 'You\'ve Already Trained Today' } };
  }

  let updates: IUserUpdates = {
    $inc: {
      health: -10,
      strength: 1,
      xp: 1,
    },
    $set: {
      canTrain: new Date(new Date().setUTCHours(24, 0, 0, 0)),
    }
  };

  if ((user.xp + 1) >= neededXP(user.level)) {
    updates['$inc']['level'] = 1;
    updates['$inc']['gold'] = 5;
    // Build Alert
    updates['$addToSet'] = { alerts: await buildLevelUpAlert(user.level + 1) }
  }

  let updated = await user.updateOne(updates).exec();

  if (updated) {
    return { status_code: 200, payload: { success: true, message: 'Received +1 Strength and +1 XP' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function apply_for_job({user_id, company_id, job_id }: IApplyJobParams): Promise<ActionResult> {
  let ret: ActionResult = { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  const session = await Company.startSession();
  try {
    await session.withTransaction(async () => {
      let user: IUser = await User.findOne({ _id: user_id }).exec();
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }

      let company: ICompany = await Company.findOne({ _id: company_id }).exec();
      if (!company) {
        ret.status_code = 404;
        ret.payload.error = 'Company Not Found';
        throw new Error(ret.payload.error);
      } else if (user._id === company.ceo) {
        ret.status_code = 400;
        ret.payload.error = 'Cannot Be Hired In Your Own Company';
        throw new Error(ret.payload.error);
      }

      let jobIndex: number = company.jobOffers.findIndex(offer => offer.id === job_id);
      if (jobIndex === -1) {
        ret.status_code = 404;
        ret.payload.error = 'Job Offer Not Found';
        throw new Error(ret.payload.error);
      }

      let offer = company.jobOffers[jobIndex];

      let newEmployee: IEmployee = {
        user_id: user._id,
        title: offer.title,
        wage: offer.wage,
      };

      let compUpdates = {
        $pull: { jobOffers: { id: job_id } },
        $addToSet: { employees: newEmployee },
      };

      let updatedComp = await company.updateOne(compUpdates).session(session);
      if (!updatedComp) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let updatedUser = await user.updateOne({ $set: { job: company._id } }).session(session);
      if (updatedUser) {
        ret.status_code = 200;
        ret.payload = { success: true, message: 'Job Application Sent' };
      } else {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function work(user_id: number): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'Employee Not Found' } };
  } else if (!user.job || user.job === 0) {
    return { status_code: 400, payload: { success: false, error: 'You Are Not Employed' } };
  } else if (user.health < 10) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Health' } };
  }

  let job: ICompany = await Company.findOne({ _id: user.job }).exec();
  if (!job) {
    return { status_code: 404, payload: { success: false, error: 'Employer Not Found' } };
  }

  // Get Company Current Country to get Currency
  let compLocation: IRegion = await Region.findOne({ _id: job.location }).exec();  
  if (!compLocation) {
    return { status_code: 404, payload: { success: false, error: 'Company Location Not Found' } };
  }

  let compCountry: ICountry = await Country.findOne({ _id: compLocation.owner }).exec();
  if (!compCountry) {
    return { status_code: 404, payload: { success: false, error: 'Company Country Not Found' } };
  }

  // Get Employee Record
  let employee: IEmployee = job.employees.find(emp => emp.user_id === user_id);
  if (!employee) {
    return { status_code: 400, payload: { success: false, error: 'You Are Not Employed By That Company' } };
  }

  // Deduct Wage from Company Treasury
  let fundsIndex = job.funds.findIndex(cc => cc.currency === compCountry.currency);
  if (fundsIndex === -1 || job.funds[fundsIndex].amount < employee.wage) {
    return { status_code: 400, payload: { success: false, error: 'Company Doesn\'t Have Sufficient Funds to Pay You' } };
  }

  // Produce Items
  let itemIndex: number = job.inventory.findIndex(item => item.item_id === job.type);
  // TODO: Update Formula for non-raw companies to consume raws
  let tempFormula = Math.round(((user.health / 100) + 1) * 10);

  // Add wage to user wallet
  let walletIndex: number = user.wallet.findIndex(money => money.currency === job.funds[fundsIndex].currency);

  const session = await Company.startSession();
  let ret: ActionResult = { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  try {
    await session.withTransaction(async () => {
      let compQuery = {
        _id: job._id,
        funds: { $elemMatch: { currency: compCountry.currency } },
      };

      let compUpdates = {
        $inc: { 'funds.$.amount': -employee.wage }
      };

      if (itemIndex > -1) {
        compQuery['inventory'] = { $elemMatch: { item_id: job.type } };
        compUpdates['$inc']['inventory.$.quantity'] = tempFormula;
      } else {
        let newItem: IItem = {
          item_id: job.type,
          quantity: tempFormula,
        };

        compUpdates['$addToSet'] = { inventory: newItem };
      }

      // Update Company
      let updatedComp = await job.updateOne({ $set: compUpdates }).exec();
      if (!updatedComp) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let userUpdates: IUserUpdates = {
        $inc: {
          xp: 1,
          health: -10,
        },
        $set: { canWork: new Date(new Date().setUTCHours(24, 0, 0, 0)) },
      };

      if (walletIndex > -1) {
        userUpdates['$inc']['wallet.$.amount'] = employee.wage;
      } else {
        let newMoney: IWalletItem = {
          currency:job.funds[fundsIndex].currency,
          amount: employee.wage, 
        };
        userUpdates['$addToSet'] = { wallet: newMoney };
      }

      if ((user.xp + 1) >= neededXP(user.level)) {
        userUpdates['$inc']['level'] = 1;
        userUpdates['$inc']['gold'] = 5;
        userUpdates['$addToSet'] = {
          alerts: await buildLevelUpAlert(user.level + 1),
        };
      }

      // Update User
      let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
      if (updatedUser) {
        ret.status_code = 200;
        ret.payload = { success: true, message: 'Received +1 XP and salary' };
      } else {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function collect_rewards(user_id: number): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (new Date(user.canCollectRewards) > new Date(Date.now())) {
    return { status_code: 400, payload: { success: false, error: 'You\'ve Already Collected Daily Rewards Today' } };
  }

  let updates: IUserUpdates = {
    $inc: { xp: 1 },
    $set: {
      canCollectRewards: new Date(new Date().setUTCHours(24, 0, 0, 0)),
    },
  };

  if ((user.xp + 1) >= neededXP(user.level)) {
    updates['$inc']['xp'] = 1;
    updates['$inc']['gold'] = 5;
    updates['$addToSet'] = {
      alerts: await buildLevelUpAlert(user.level + 1),
    };
  }

  let updated = await user.updateOne(updates).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true, message: 'Received bonus +1 XP' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function read_alert({ user_id, alert_id }: IHandleAlertParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 500, payload: { success: false, error: 'User Not Found' } };
  } else if (user.alerts.findIndex(alert => alert.id === alert_id) === -1) {
    return { status_code: 500, payload: { success: false, error: 'Invalid Alert' } };
  }

  let query = {
    _id: user._id,
    alerts: { $elemMatch: { id: alert_id } },
  };

  let updates = {
    $set: { 'alerts.$.read': true },
  };

  let updated = await User.updateOne(query, updates).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function delete_alert({ user_id, alert_id }: IHandleAlertParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 500, payload: { success: false, error: 'User Not Found' } };
  }
  
  let alert = user.alerts.find(alert => alert.id === alert_id)
  if (!alert) {
    return { status_code: 500, payload: { success: false, error: 'Invalid Alert' } };
  }

  if (alert.type === AlertTypes.LEVEL_UP) {
    let fromUserUpdates = {
      $pull: { alerts: { id: alert_id } },
    };

    let fromUserUpdated = await User.updateOne({ _id: user._id }, fromUserUpdates).exec();
    if (!fromUserUpdated) {
      return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
    }
  }

  let updates = {
    $pull: { alerts: { id: alert_id } },
  };

  let updated = await user.updateOne(updates).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function send_fr({ user_id, profile_id }: ISendFRParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (user.friends.includes(profile_id)) {
    return { status_code: 400, payload: { success: false, error: 'Already Friends With User' } };
  } else if (user.pendingFriends.includes(profile_id)) {
    return { status_code: 400, payload: { success: false, error: 'You\'ve Already Sent A Friend Request' } };
  }

  let profile: IUser = await User.findOne({ _id: profile_id }).exec();
  if (!profile) {
    return { status_code: 400, payload: { success: false, error: 'User Not Found' } };
  }

  const { randomBytes } = await import('crypto');
  let buf = await randomBytes(10);

  let alert: IAlert = {
    id: buf.toString('hex'),
    read: false,
    type: AlertTypes.SEND_FR,
    message: `You've received a friend request from ${user.username}`,
    from: user_id,
    timestamp: new Date(Date.now()),
  };

  let profileUpdates = { $addToSet: { alerts: alert } };
  let updatedProfile = await profile.updateOne(profileUpdates).exec();
  if (!updatedProfile) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong'} };
  }

  let updates = { $addToSet: { pendingFriends: profile_id } };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function accept_fr({ user_id, alert_id }: IHandleAlertParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }
  
  const alert = user.alerts.find(alert => alert.id === alert_id);
  if (!alert) {
    return { status_code: 400, payload: { success: false, error: 'Invalid Alert' } };
  }

  const profile_id = alert?.from;
  if (!profile_id) {
    return { status_code: 400, payload: { success: false, error: 'Invalid Alert' } };
  }

  let profile: IUser = await User.findOne({ _id: profile_id }).exec();
  if (!profile) {
    return { status_code: 400, payload: { success: false, error: 'User Not Found' } };
  } else if (!profile.pendingFriends.includes(user_id)) {
    return { status_code: 400, payload: { success: false, error: 'Invalid Friend Request' } };
  }

  const session = await User.startSession();
  let ret: ActionResult = { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  try {
    await session.withTransaction(async () => {
      let profileUpdates = {
        $pull: { pendingFriends: user_id },
        $addToSet: { friends: user_id },
      };
    
      let updatedProfile = await profile.updateOne(profileUpdates).session(session);
      if (!updatedProfile) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let query = {
        _id: user._id,
        alerts: { $elemMatch: { id: alert_id } },
      };
    
      let updates = {
        $addToSet: { friends: profile_id },
        $set: { 'alerts.$.read': true },
      };
      let updated = await User.updateOne(query, updates).exec();
      if (updated) {
        ret.status_code = 200;
        ret.payload = { success: true, message: 'Friend Added' };
      } else {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function buy_item({ user_id, company_id, offer_id, quantity }: IBuyItemParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }

  let company: ICompany = await Company.findOne({ _id: company_id }).exec();
  if (!company) {
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  }

  let region: IRegion = await Region.findOne({ _id: company.location }).exec();
  if (!region) {
    return { status_code: 404, payload: { success: false, error: 'Company Location Not Found' } };
  }

  let country: ICountry = await Country.findOne({ _id: region.owner }).exec();
  if (!country) {
    return { status_code: 404, payload: { success: false, error: 'Company Country Not Found' } };
  }

  const session = await Company.startSession();
  let ret: ActionResult = { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  try {
    await session.withTransaction(async () => {
      // Remove product
      let offer = company.productOffers.find(o => o?.id === offer_id);
      if (!offer) {
        ret.status_code = 400;
        ret.payload.error = 'Offer Not Found';
        throw new Error(ret.payload.error);
      } else if (offer.quantity < quantity) {
        ret.status_code = 400;
        ret.payload.error = 'Company Has Insufficient Quantity';
        throw new Error(ret.payload.error);
      }
      
      let compQuery: IMap = { _id: company._id };
      let userQuery: IMap = { _id: user._id };
      let compUpdates: IMap = {};
      let userUpdates: IMap = {};

      if (offer.quantity === quantity) {
        // Remove offer
        if (compUpdates['$pull']) {
          compUpdates['$pull']['productOffers'] = { id: offer?.id };
        } else {
          compUpdates['$pull'] = { productOffers: { id: offer?.id } };
        }
      } else {
        // Reduce quantity
        compQuery['productOffers'] = { $elemMatch: { id: offer?.id } };
        if (compUpdates['$inc']) {
          compUpdates['$inc']['productOffers.$.quantity'] = -quantity;
        } else {
          compUpdates['$inc'] = { 'productOffers.$.quantity': -quantity };
        }
      }

      // Subtract Cost From User
      let userCC = user.wallet.find(cc => cc.currency === country.currency);
      let cost = roundMoney(quantity * offer.price);
      if (!userCC || userCC.amount < cost) {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Funds';
        throw new Error(ret.payload.error);
      }

      if (roundMoney(userCC.amount) > cost) {
        userQuery['wallet'] = { $elemMatch: { currency: country.currency } };
        // Subtract Cost
        if (userUpdates['$inc']) {
          userUpdates['$inc']['wallet.$.amount'] = -cost;
        } else {
          userUpdates['$inc'] = { 'wallet.$.amount': -cost };
        }
      } else {
        // Remove entire wallet item
        if (userUpdates['$pull']) {
          userUpdates['$pull']['wallet'] = { currency: country.currency };
        } else {
          userUpdates['$pull'] = { wallet: { currency: country.currency } };
        }
      }

      // Calculate taxes
      let taxPercentage: number = country.policies.taxes.vat[offer.product_id];

      // Include Import taxes
      if (user.country !== country._id)
        taxPercentage += country.policies.taxes.import[offer.product_id];

      let taxRevenue: number = roundMoney(cost * (taxPercentage / 100));

      // Add Cost to Company
      let compCC = company.funds.find(cc => cc.currency === country.currency);
      let compRevenue: number = roundMoney(cost - taxRevenue);
      if (!compCC) {
        // Add funds to new funds item
        let newFunds: IFunds = { currency: compCC.currency, amount: compRevenue };
        if (compUpdates['$addToSet'])
          compUpdates['$addToSet']['funds'] = newFunds;
        else
          compUpdates['$addToSet'] = { funds: newFunds };
      } else {
        // Add funds to funds item
        compQuery['funds'] = { $elemMatch: { currency: compCC.currency } };
        if (compUpdates['$inc']) {
          compUpdates['$inc']['funds.$.amount'] = roundMoney(cost - taxRevenue);
        } else {
          compUpdates['$inc'] = { 'funds.$.amount': roundMoney(cost - taxRevenue) };
        }
      }

      // Add tax revenue to country
      let countryUpdates: IMap = {};

      if (country.treasury[country.currency]) {
        countryUpdates['$inc'] = { [`treasury.${country.currency}`]: taxRevenue };
      } else {
        countryUpdates['$set'] = { [`treasury.${country.currency}`]: taxRevenue };
      }

      // Add Items to User Inventory
      let item = user.inventory.find(i => i.item_id === offer.product_id);
      let newItem: IItem = { item_id: item.item_id, quantity };
      if (!item) {
        if (userUpdates['$addToSet'])
          userUpdates['$addToSet']['inventory'] = newItem;
        else
          userUpdates['$addToSet'] = { inventory: newItem };
      } else {
        if (userUpdates['$inc'])
          userUpdates['$inc']['inventory.$.quantity'] = quantity;
        else
          userUpdates['$addToSet'] = { inventory: newItem };
      }

      let updatedCountry = await country.updateOne(countryUpdates).session(session);
      if (!updatedCountry) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let updatedComp = await Company.updateOne(compQuery, compUpdates).session(session);
      if (!updatedComp) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let updatedUser = await User.updateOne(userQuery, userUpdates).session(session);
      if (!updatedUser) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Items Purchased' };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function send_shout({ user_id, shout }: ICreateShoutParams): Promise<ActionResult> {
  const user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (shout.scope !== 'global' && shout.scope !== 'country' && shout.scope !== 'party' && shout.scope !== 'unit') {
    return { status_code: 400, payload: { success: false, error: 'Invalid Scope' } };
  } else if ((shout.scope === 'global' && shout.scope_id !== 0) || (shout.scope !== 'global' && shout.scope_id === 0)) {
    return { status_code: 400, payload: { success: false, error: 'Invalid Scope ID' } };
  } else if (user_id !== shout.author) {
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };
  }

  const doc_count: number = await Shout.estimatedDocumentCount() + 1;
  const new_shout = new Shout({
    _id: doc_count,
    ...shout,
    timestamp: new Date(Date.now()),
  });
  
  await new_shout.save();

  return { status_code: 200, payload: { success: true, message: 'Shout Sent' } };
}

async function like_shout({ user_id, shout_id }: IHandleShoutParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }

  let shout: IShout = await Shout.findOne({ _id: shout_id }).exec();
  if (!shout) {
    return { status_code: 404, payload: { success: false, error: 'Shout Not Found' } };
  } else if (shout.likes.includes(user._id)) {
    return { status_code: 400, payload: { success: false, error: 'Shout Already Liked' } };
  }

  let shoutUpdates = { $addToSet: { likes: user._id } };
  let updatedShout = await shout.updateOne(shoutUpdates).exec();
  if (updatedShout) {
    return { status_code: 200, payload: { success: true, message: 'Shout Liked' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function unlike_shout({ user_id, shout_id }: IHandleShoutParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }

  let shout: IShout = await Shout.findOne({ _id: shout_id }).exec();
  if (!shout) {
    return { status_code: 404, payload: { success: false, error: 'Shout Not Found' } };
  }

  let likeIndex = shout.likes.findIndex(like => like === user._id);
  if (likeIndex === -1) {
    return { status_code: 400, payload: { success: false, error: 'Shout Already Unliked' } };
  }

  let shoutUpdates = { $pull: { likes: user._id } };
  let updatedShout = await shout.updateOne(shoutUpdates).exec();
  if (updatedShout) {
    return { status_code: 200, payload: { success: true, error: 'Shout Unliked' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

// TODO: Filter for malicious text
async function update_desc({ user_id, desc }: IUpdateDescParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };

  let userUpdates = { description: desc };
  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Description Updated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_username({ user_id, username }: IUpdateUsernameParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (user.gold < 25) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };
  }

  let exists: IUser = await User.findOne({ username }).exec();
  if (exists) {
    return { status_code: 400, payload: { success: false, error: 'Username Is Already Taken' } };
  }

  let userUpdates = { $set: { username }, $inc: { gold: -25 } };
  let updatedUser = await user.updateOne(userUpdates).exec();
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Username Updated' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_password({ user_id, currPw, newPw }: IUpdatePwParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }

  // Validate Current PW
  if (!await bcrypt.compare(currPw, user.password)) {
    return { status_code: 400, payload: { success: false, error: 'Invalid Credentials' } };
  } else if (newPw !== currPw) {
    return { status_code: 400, payload: { success: false, error: 'Passwords Are The Same' } };
  }

  // Hash New PW
  let hashed_pw = await bcrypt.hash(newPw, await bcrypt.genSalt());

  // Update User
  let userUpdates = { password: hashed_pw };
  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Password Updated' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function travel({ user_id, region_id }: ITravelParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user.location === region_id)
    return { status_code: 400, payload: { success: false, error: 'Already Located In Region' } };

  let regions: IRegion[] = await Region.find({}).exec();
  let travel_info = getDistance(regions, user.location, region_id);

  if (user.gold < travel_info.cost)
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };

  let userUpdates = { $inc: { gold: -travel_info.cost }, $set: { location: region_id } };
  let updatedUser = await user.updateOne(userUpdates).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Successfully Relocated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function upload({ user_id, image }: IUploadImageParams): Promise<ActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (!image)
    return { status_code: 400, payload: { success: false, error: 'Invalid Base64 Image' } };

  let updatedUser = await user.updateOne({ $set: { image } }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Image Uploaded' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function donate_funds({ user_id, profile_id, gold, funds }: IDonateParams): Promise<ActionResult> {
  let ret: ActionResult = { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      if (user_id === profile_id) {
        ret.status_code = 400;
        ret.payload.error = 'You Cannot Donate To Yourself';
        throw new Error(ret.payload.error);
      }

      let user: IUser = await User.findOne({ _id: user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }

      let profile: IUser = await User.findOne({ _id: profile_id }).session(session);
      if (!profile) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }

      let userQuery: IMap = { _id: user._id };
      let userUpdates: IMap = {};
      let profileQuery: IMap = { _id: profile._id };
      let profileUpdates: IMap = {};

      if (gold && user.gold >= gold) {
        userUpdates['$inc'] = { gold: -gold };
        profileUpdates['$inc'] = { gold };
      } else {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Gold';
        throw new Error(ret.payload.error);
      }

      if (funds) {
        let userCC = user.wallet.find(cc => cc.currency === funds.currency);
        let profileCC = profile.wallet.find(cc => cc.currency === funds.currency);

        if (userCC && userCC.amount >= funds.amount) {
          userQuery['wallet'] = { currency: funds.currency };
          if (userUpdates['$inc'])
            userUpdates['$inc']['wallet.$.amount'] = -funds.amount;
          else
            userUpdates['$inc'] = { 'wallet.$.amount': -funds.amount };
        } else {
          ret.status_code = 400;
          ret.payload.error = 'Insufficient Currency';
          throw new Error(ret.payload.error);
        }

        if (profileCC) {
          profileQuery['wallet'] = { currency: funds.currency };
          if (profileUpdates['$inc'])
            profileUpdates['$inc']['wallet.$.amount'] = funds.amount;
          else
            profileUpdates['$inc'] = { 'wallet.$.amount': funds.amount };
        } else {
          profileUpdates['$addToSet'] = { wallet: funds };
        }
      }

      let message: string = '';
      if (gold && funds)
        message = `You have received ${gold.toFixed(2)} gold and ${funds.amount.toFixed(2)} ${funds.currency} from ${user.username}`;
      else if (funds)
        message = `You have received ${funds.amount.toFixed(2)} ${funds.currency} from ${user.username}`;
      else
        message = `You have received ${gold.toFixed(2)} gold from ${user.username}`;

      const { randomBytes } = await import('crypto');
      let buf = await randomBytes(10);

      let donateAlert: IAlert = {
        id: buf.toString('hex'),
        read: false,
        type: UserActions.DONATE,
        message,
        timestamp: new Date(Date.now()),
      };

      if (profileUpdates['$addToSet'])
        profileUpdates['$addToSet']['alerts'] = donateAlert;
      else
        profileUpdates['$addToSet'] = { alerts: donateAlert };

      let updatedProfile = await User.updateOne(profileQuery, profileUpdates).session(session);
      if (!updatedProfile) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let updatedUser = await User.updateOne(userQuery, userUpdates).session(session);
      if (!updatedUser) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Funds Donated' };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function gift_items({ user_id, profile_id, items }: IGiftParams): Promise<ActionResult> {
  let ret: ActionResult = { status_code: 500, payload: { success: false, error: 'Something Went Wrong'} };
  if (user_id === profile_id) {
    ret.status_code = 400;
    ret.payload.error = 'You Cannot Send Gifts To Yourself';
    return ret;
  }

  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      let user: IUser = await User.findOne({ _id: user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }
      
      let profile: IUser = await User.findOne({ _id: profile_id }).session(session);
      if (!profile) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }

      let hasError: boolean = false;
      for (let item of items) {
        let idx = user.inventory.findIndex(i => i.item_id === item.item_id);
        if (!idx || user.inventory[idx].quantity < item.quantity) {
          hasError = true;
          break;
        }
    
        let profIdx = profile.inventory.findIndex(i => i.item_id === item.item_id);

        if (profIdx === -1)
          profile.inventory.push(item);
        else
          profile.inventory[profIdx].quantity += item.quantity;
    
        if (user.inventory[idx].quantity === item.quantity)
          user.inventory.splice(idx, 1);
        else
          user.inventory[idx].quantity -= item.quantity;
      }
    
      if (hasError) {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Items';
        throw new Error(ret.payload.error);
      }

      const { randomBytes } = await import('crypto');
      let buf = await randomBytes(10);
    
      let giftAlert: IAlert = {
        id: buf.toString('hex'),
        read: false,
        type: UserActions.GIFT,
        message: `You've been gifted items from ${user.username}`,
        timestamp: new Date(Date.now()),
      };
    
      let profUpdates = { $set: { inventory: [...profile.inventory] }, $addToSet: { alerts: giftAlert } };
      let userUpdates = { inventory: [...user.inventory] };
      let updatedProf = await profile.updateOne(profUpdates).exec();
      if (!updatedProf) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }
    
      let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
      if (!updatedUser) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Items Gifted' };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function create_thread(data: ICreateThreadParams): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      let user: IUser = await User.findOne({ _id: data.user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }

      let { participants, subject, timestamp } = data;
      let msg: IMsg = { from: data.user_id, message: data.message, timestamp: data.timestamp };

      const { randomBytes } = await import('crypto');
      let buf = await randomBytes(10);
      let threadId: string = buf.toString('hex');

      let msgThread: IThread = {
        id: threadId,
        participants: [...participants, data.user_id],
        subject,
        messages: [msg],
        timestamp,
        read: false,
      };

      let othersUpdated = await User.updateMany(
        { _id: { $in: participants } },
        { $addToSet: { messages: msgThread } }
      ).session(session);

      if (!othersUpdated) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      msgThread.read = true;
      let userUpdated = await user.updateOne({ $addToSet: { messages: msgThread } });
      if (!userUpdated) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Message Sent' };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function read_thread(data: IHandleThread): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let user: IUser = await User.findOne({ _id: data.user_id }).exec();
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    }

    let msgIdx = user.messages.findIndex(thread => thread.id === data.thread_id);
    if (msgIdx === -1) {
      ret.status_code = 400;
      ret.payload.error = 'Thread Not Found';
      throw new Error(ret.payload.error);
    }

    let query: IMap = { _id: user._id, messages: { $elemMatch: { id: data.thread_id } } };
    let updates: IMap = { $set: { 'messages.$.read': true } };

    let updated = await User.updateOne(query, updates).exec();
    if (!updated) {
      throw new Error(ret.payload.error);
    }

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Thread Marked As Read' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function delete_thread(data: IHandleThread): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let user: IUser = await User.findOne({ _id: data.user_id }).exec();
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    }
  
    let msgIdx = user.messages.findIndex(thread => thread.id === data.thread_id);
    if (msgIdx === -1) {
      ret.status_code = 400;
      ret.payload.error = 'Thread Not Found';
      throw new Error(ret.payload.error);
    }

    let updates: IMap = { $pull: { messages: { id: data.thread_id } } }
    let updated = await user.updateOne(updates).exec();
    if (!updated)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Thread Deleted' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function send_msg(data: ISendMsg): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      let user: IUser = await User.findOne({ _id: data.user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }

      let thread = user.messages.find(thrd => thrd.id === data.thread_id);
      if (thread) {
        ret.status_code = 404;
        ret.payload.error = 'Mail Thread Not Found';
        throw new Error(ret.payload.error);
      }

      let msg: IMsg = { from: user._id, message: data.message, timestamp: new Date(data.timestamp) };

      let query: IMap = { _id: { $in: thread.participants }, messages: { id: data.thread_id } };
      let updates: IMap = {
        $set: { 'messages.$.read': false },
        $addToSet: { messages: msg },
      };
      let updated = await User.updateMany(query, updates).session(session);
      if (!updated) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Message Sent' };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function create_news(data: ICreateNewspaper): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  const session = await User.startSession();

  try {
    await session.withTransaction(async () => {
      let user: IUser = await User.findOne({ _id: data.user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }
      else if (user.gold < 5) {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Gold';
        throw new Error(ret.payload.error);
      }
  
      let news_id: number = await Newspaper.estimatedDocumentCount() + 1;
      let newspaper = new Newspaper({ _id: news_id, author: user._id, name: data.name });
      newspaper.$session(session);
      let created = await newspaper.save();
      if (!created) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let updates: IMap = {
        $inc: { gold: -5 },
        $set: { newspaper: created._id },
      };
      let updated = await user.updateOne(updates).exec();
      if (!updated) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Newspaper Created', newspaper: created._id };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function like_article(data: ILikeArticle): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let newspaper: INewspaper = await Newspaper.findOne({ _id: data.newsId }).exec();
    if (!newspaper) {
      ret.status_code = 404;
      ret.payload.error = 'Newspaper Not Found';
      throw new Error(ret.payload.error);
    }
    
    let articleIndex = newspaper.articles.findIndex(a => a.id === data.articleId);
    if (articleIndex === -1) {
      ret.status_code = 404;
      ret.payload.error = 'Article Not Found';
      throw new Error(ret.payload.error);
    }

    let query: IMap = { _id: newspaper._id, articles: { id: data.articleId } };
    let updates: IMap = {};

    let likeIndex = newspaper.articles[articleIndex].likes.findIndex(userId => userId === data.user_id);
    if (likeIndex === -1)
      updates['$addToSet'] = { 'articles.$.likes': data.user_id };
    else
      updates['$pull'] = { 'articles.$.likes': data.user_id };

    let updated = await Newspaper.updateOne(query, updates).exec();
    if (!updated) {
      throw new Error(ret.payload.error);
    }

    ret.status_code = 200;
    ret.payload = { success: true, message: likeIndex === -1 ? 'Article Liked': 'Article Unliked' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function subscribe_news(data: ISubscribeNews): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let news: INewspaper = await Newspaper.findOne({ _id: data.newsId }).exec();
    if (!news) {
      ret.status_code = 404;
      ret.payload.error = 'Newspaper Not Found';
      throw new Error(ret.payload.error);
    }

    let updates: IMap = {};

    let subIdx = news.subscribers.findIndex(usrId => usrId === data.user_id);
    if (subIdx === -1)
      updates['$addToSet'] = { subscribers: data.user_id };
    else
      updates['$pull'] = { subscribers: data.user_id };

    let updated = await news.updateOne(updates).exec();
    if (!updated)
      throw new Error(ret.payload.error)

    ret.status_code = 200;
    ret.payload = {
      success: true,
      message: subIdx === -1 ? 'Newspaper Subscribed' : 'Newspaper Unsubscribed',
    };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function run_for_cp(data: IRunForOffice): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let user: IUser = await User.findOne({ _id: data.user_id }).exec();
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    }

    let party: IParty = await Party.findOne({ _id: data.partyId }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Political Party Not Found';
      throw new Error(ret.payload.error);
    } else if (party.president === user._id) {
      ret.status_code = 400;
      ret.payload.error = 'Party President Cannot Run For Country President';
      throw new Error(ret.payload.error);
    } else if (!party.members.includes(user._id)) {
      ret.status_code = 400;
      ret.payload.error = 'You Are Not A Party Member';
      throw new Error(ret.payload.error);
    } else if (party.cpCandidates.findIndex(can => can.id === user._id) >= 0) {
      ret.status_code = 400;
      ret.payload.error = 'You Are Already A Candidate';
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
    }
    
    let candidate: ICandidate = {
      id: user._id,
      name: user.username,
      image: user.image,
      party: party._id,
      partyName: party.name,
      partyImage: party.image,
      partyColor: party.color,
      votes: election.system === ElectionSystem.ElectoralCollege ? ([] as ECVote[]) : ([] as number[]),
    };

    let updates: IMap = { $addToSet: { cpCandidates: candidate } };
    let updatedParty = await party.save();
    if (!updatedParty) {
      throw new Error(ret.payload.error);
    }

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Candidacy Submitted' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function join_party(data: IHandlePartyMembership): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  const session = await Party.startSession();

  try {
    await session.withTransaction(async () => {
      let party: IParty = await Party.findOne({ _id: data.partyId }).session(session);
      if (!party) {
        ret.status_code = 404;
        ret.payload.error = 'Party Not Found';
        throw new Error(ret.payload.error);
      } else if (party.members.includes(data.user_id)) {
        ret.status_code = 400;
        ret.payload.error = 'User Already A Party Member';
        throw new Error(ret.payload.error);
      }

      let partyUpdates: IMap = { $addToSet: { members: data.user_id } };
      let updatedParty = await party.updateOne(partyUpdates);
      if (!updatedParty) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let userUpdates: IMap = { $set: { party: party._id } };
      let updatedUser = await User.updateOne({ _id: data.user_id }, userUpdates).session(session);
      if (!updatedUser) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Successfully Joined Party' };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

async function leave_party(data: IHandlePartyMembership): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();
  const session = await Party.startSession();

  try {
    await session.withTransaction(async () => {
      // Prevent Leaving Party During An Election
      let now = new Date(Date.now());
      switch (now.getUTCDate()) {
        case 5:
        case 15:
        case 25: {
          ret.status_code = 400;
          ret.payload.error = 'Cannot Leave Party During Elections';
          throw new Error(ret.payload.error);
        }
      }

      // Validate Party Membership
      let party: IParty = await Party.findOne({ _id: data.partyId }).exec();
      if (!party) {
        ret.status_code = 404;
        ret.payload.error = 'Party Not Found';
        throw new Error(ret.payload.error);
      } else if (!party.members.includes(data.user_id)) {
        ret.status_code = 400;
        ret.payload.error = 'User Already Not A Member';
        throw new Error(ret.payload.error);
      }

      let partyUpdates: IMap = { $pull: { members: data.user_id } };
      let updatedParty = await party.updateOne(partyUpdates);
      if (!updatedParty) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let userUpdates: IMap = { $set: { party: 0 } };
      let updatedUser = await User.updateOne({ _id: data.user_id }, userUpdates).session(session);
      if (!updatedUser) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      ret.status_code = 200;
      ret.payload = { success: true, message: 'Successfully Left Party' };
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    await session.endSession();
    return ret;
  }
}

// TODO: Handle Congress & Party President Elections
async function vote(data: IHandleVote): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let user: IUser = await User.findOne({ _id: data.user_id }).exec();
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    } else if (user.residence !== data.location) {
      ret.status_code = 400;
      ret.payload.error = 'You Can Only Vote From Your Region Of Residence';
      throw new Error(ret.payload.error);
    }

    let election: IElection = await Election.findOne({ _id: data.election }).exec();
    if (!election) {
      ret.status_code = 404;
      ret.payload.error = 'Election Not Found';
      throw new Error(ret.payload.error);
    }

    let hasVoted: boolean = false;
    for (let candidate of election.candidates) {
      if (candidate.votes.findIndex(vote => findVote(vote, data.user_id)) >= 0) {
        hasVoted = true;
        break;
      }
    }

    if (hasVoted) {
      ret.status_code = 400;
      ret.payload.error = 'You Have Already Voted';
      throw new Error(ret.payload.error);
    }

    let query: IMap = { _id: election._id };
    let updates: IMap = {};
    let opts: IMap = { arrayFilters: [] };

    switch (election.type) {
      case ElectionType.CountryPresident: {
        let candidate: ICandidate = election.candidates.find(can => can.id === data.candidate);
        if (!candidate) {
          ret.status_code = 404;
          ret.payload.error = 'Candidate Not Found';
          throw new Error(ret.payload.error);
        }

        if (election.system === ElectionSystem.ElectoralCollege) {
          let locIdx: number = (candidate.votes as ECVote[]).findIndex((ecVote: ECVote) => ecVote.location === data.location);
          query['candidates'] = { $elemMatch: { id: data.candidate } };
          if (locIdx === -1) {
            let voteObj = { location: data.location, tally: [data.user_id] };
            updates['$addToSet'] = { 'candidates.$.votes': voteObj };
          } else {
            updates['$addToSet'] = { 'candidates.$.votes.$[vote].tally': data.user_id };
            opts?.arrayFilters.push({ 'vote.location': data.location });
          }
        }

        break;
      }
      case ElectionType.Congress:
      case ElectionType.PartyPresident:
      default: {
        ret.status_code = 400;
        ret.payload.error = 'Unknown Election Type';
        throw new Error(ret.payload.error);
      }
    }

    let updatedElection = await Election.updateOne(query, updates, opts);
    if (!updatedElection) {
      throw new Error(ret.payload.error);
    }

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Vote Submitted' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function run_for_congress(data: IRunForOffice): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let user: IUser = await User.findOne({ _id: data.user_id }).exec();
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    }
  
    let residence: IRegion = await Region.findOne({ _id: user.residence }).exec();
    if (!residence) {
      ret.status_code = 404;
      ret.payload.error = 'Residence Region Not Found';
      throw new Error(ret.payload.error);
    }
    
    let party: IParty = await Party.findOne({ _id: data.partyId }).exec();
    if (!party) {
      ret.status_code = 404;
      ret.payload.error = 'Party Not Found';
      throw new Error(ret.payload.error);
    } else if (!party.members.includes(user._id)) {
      ret.status_code = 400;
      ret.payload.error = 'You Are Not A Party Member';
      throw new Error(ret.payload.error);
    } else if (party.president === user._id) {
      ret.status_code = 400;
      ret.payload.error = 'Party Presidents Cannot Run For Congress';
      throw new Error(ret.payload.error);
    } else if (party.congressCandidates.findIndex(can => can.id === user._id) >= 0) {
      ret.status_code = 400;
      ret.payload.error = 'Already A Congress Candidate';
      throw new Error(ret.payload.error);
    }
  
    let country: ICountry = await Country.findOne({ _id: party.country }).exec();
    if (!country) {
      ret.status_code = 404;
      ret.payload.error = 'Country Not Found';
      throw new Error(ret.payload.error);
    } else if (country.government.president === user._id) {
      ret.status_code = 400;
      ret.payload.error = 'Country Presidents Cannot Run For Congress';
      throw new Error(ret.payload.error);
    }
  
    let date: Date = new Date(Date.now());
    let year: number = date.getUTCDate() > 25 && date.getUTCMonth() === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
    let month: number = date.getUTCDate() < 25 ? date.getUTCMonth() + 1 : ((date.getUTCMonth() + 1) % 12) + 1;
    let query = {
      isActive: false,
      isCompleted: false,
      type: ElectionType.Congress,
      typeId: user.residence,
      year,
      month,
    };
  
    let election: IElection = await Election.findOne(query).exec();
    if (!election) {
      ret.status_code = 404;
      ret.payload.error = 'Congress Election Not Found';
      throw new Error(ret.payload.error);
    }
  
    let candidate: ICandidate = {
      id: user._id,
      name: user.username,
      image: user.image,
      party: party._id,
      partyName: party.name,
      partyImage: party.image,
      partyColor: party.color,
      location: residence._id,
      locationName: residence.name,
      votes: [] as number[],
    };
  
    let updates: IMap = { $addToSet: { congressCandidates: candidate } };
    let updatedParty = await party.updateOne(updates);
    if (!updatedParty) {
      throw new Error(ret.payload.error);
    }

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Candidacy Submitted' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function move_residence({ user_id, region_id }: ITravelParams): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let now = new Date(Date.now());
    switch (now.getUTCDate()) {
      case 5:
      case 25: {
        ret.status_code = 400;
        ret.payload.error = 'Cannot Change Residence During Presidential or Congressional Elections';
        throw new Error(ret.payload.error);
      }
      default:
        break;
    }

    let user: IUser = await User.findOne({ _id: user_id }).exec();
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    }
    
    let region: IRegion = await Region.findOne({ _id: region_id, owner: user.country }).exec();
    if (!region) {
      ret.status_code = 404;
      ret.payload.error = 'Region Not Found Or Invalid Region For Relocation';
      throw new Error(ret.payload.error);
    }

    if (region.owner !== user.country) {
      ret.status_code = 400;
      ret.payload.error = 'Residence Region Owner Must Match Citizenship';
      throw new Error(ret.payload.error);
    }

    let updated = await user.updateOne({ $set: { residence: region_id } }).exec();
    if (!updated) {
      throw new Error(ret.payload.error);
    }

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Residence Updated' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}