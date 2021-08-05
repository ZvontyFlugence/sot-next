import { validateToken } from '@/util/auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { UserActions } from '@/util/actions';
import User, { IAlert, IMsg, IUser, IUserUpdates, IWalletItem } from '@/models/User';
import { neededXP } from '@/util/ui';
import { buildLevelUpAlert, findVote, getDistance, IItem, roundMoney } from '@/util/apiHelpers';
import { connectToDB } from '@/util/mongo';
import Company, { ICompany, IEmployee } from '@/models/Company';
import Region, { IRegion } from '@/models/Region';
import Country, { ElectionSystem, ICountry } from '@/models/Country';
import Shout, { IShout } from '@/models/Shout';
import bcrypt from 'bcrypt';
import Newspaper, { INewspaper } from '@/models/Newspaper';
import Party, { IParty } from '@/models/Party';
import Election, { ECVote, ElectionType, ICandidate, IElection } from '@/models/Election';
import { ObjectId } from 'mongoose';

interface IUserActionResult {
  status_code: number,
  payload: {
    success: boolean,
    error?: string,
    message?: string,
    newspaper?: number,
  },
}

interface IRequestBody {
  action: string,
  data?: IApplyJobParams | IHandleAlertParams | ISendFRParams | IBuyItemParams | ICreateShoutParams |
    IHandleShoutParams | IUpdateUsernameParams | IUpdatePwParams | ITravelParams | IGiftParams |
    IUpdateDescParams | IDonateParams | ICreateThreadParams | IHandleThread | ISendMsg | IRunForOffice |
    ICreateNewspaper | ILikeArticle | ISubscribeNews | IHandleVote
}

interface IApplyJobParams {
  user_id?: number,
  company_id: number,
  job_id: string,
}

interface IHandleAlertParams {
  user_id?: number,
  alert_index: number,
}

interface ISendFRParams {
  user_id?: number,
  profile_id: number,
}

interface IBuyItemParams {
  user_id?: number,
  company_id: number,
  offer_id: string,
  quantity: number,
}

interface ICreateShoutParams {
  user_id?: number,
  shout: {
    scope: 'global' | 'country' | 'party' | 'unit',
    scope_id: number,
    author: number,
    message: string,
  },
}

interface IHandleShoutParams {
  user_id?: number,
  shout_id: number,
}

interface IUpdateUsernameParams {
  user_id?: number,
  username: string,
}

interface IUpdatePwParams {
  user_id?: number,
  currPw: string,
  newPw: string,
}

interface ITravelParams {
  user_id?: number,
  region_id?: number,
}

interface IUploadImageParams {
  user_id?: number,
  image: any,
}

interface IUpdateDescParams {
  user_id?: number,
  desc: string,
}

interface IDonateParams {
  user_id?: number,
  profile_id: number,
  gold?: number,
  funds?: {
    currency: string,
    amount: number,
  }
}

interface IGiftParams {
  user_id?: number,
  profile_id: number,
  items: IItem[],
}

interface ICreateThreadParams {
  user_id?: number,
  participants: number[],
  subject: string,
  message: string,
  timestamp: Date,
}

interface IHandleThread {
  user_id?: number,
  thread_id: string,
}

interface ISendMsg extends IHandleThread {
  message: string,
  timestamp: Date,
}

interface ICreateNewspaper {
  user_id?: number,
  name: string,
}

interface ILikeArticle {
  user_id?: number,
  newsId: number,
  articleId: string,
}

interface ISubscribeNews {
  user_id?: number,
  newsId: number,
}

interface IRunForOffice {
  user_id?: number,
  partyId: number,
}

interface IHandlePartyMembership {
  user_id?: number,
  partyId: number,
}

interface IHandleVote {
  user_id?: number,
  candidate: number,
  election: ObjectId,
  location: number,
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

      let result: IUserActionResult;

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

async function heal(user_id: number): Promise<IUserActionResult> {
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

async function apply_for_job({user_id, company_id, job_id }: IApplyJobParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }

  let company: ICompany = await Company.findOne({ _id: company_id }).exec();
  if (!company) {
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  } else if (user._id === company.ceo) {
    return { status_code: 400, payload: { success: false, error: 'Cannot Be Hired In Your Own Company' } };
  }

  let jobIndex: number = company.jobOffers.findIndex(offer => offer.id === job_id);
  if (jobIndex === -1) {
    return { status_code: 404, payload: { success: false, error: 'Job Offer Not Found' } };
  }

  // Remove Job Offer
  let offer = company.jobOffers.splice(jobIndex, 1);
  // Set User Job to Target Company
  user.job = company._id;
  // Add User to Company Employee List
  company.employees.push({ user_id: user._id, title: offer[0].title, wage: offer[0].wage });

  // Update Company
  let compUpdates = { jobOffers: [...company.jobOffers], employees: [...company.employees] };
  let updatedComp = await company.updateOne({ $set: { ...compUpdates } });
  if (!updatedComp) {
    return { status_code: 500, payload: { success: false, error: 'Failed to Update Company' } };
  }

  // Update User
  let userUpdates = { job: user.job };
  let updatedUser = await user.updateOne({ $set: { ...userUpdates } });
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Job Application Sent' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function work(user_id: number): Promise<IUserActionResult> {
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

  job.funds[fundsIndex].amount = roundMoney(job.funds[fundsIndex].amount - employee.wage);

  // Add wage to user wallet
  let walletIndex: number = user.wallet.findIndex(money => money.currency === job.funds[fundsIndex].currency);
  if (walletIndex > -1) {
    user.wallet[walletIndex].amount = roundMoney(user.wallet[walletIndex].amount + employee.wage);
  } else {
    user.wallet.push({ currency: job.funds[fundsIndex].currency, amount: employee.wage });
  }

  // Produce Items
  let itemIndex: number = job.inventory.findIndex(item => item.item_id === job.type);
  // TODO: Update Formula for non-raw companies to consume raws
  let tempFormula = Math.round(((user.health / 100) + 1) * 10);
  
  // Add items to company inventory
  if (itemIndex > -1) {
    job.inventory[itemIndex].quantity += tempFormula;
  } else {
    job.inventory.push({ item_id: job.type, quantity: tempFormula });
  }

  // Update Company
  let compUpdates = { inventory: [...job.inventory], funds: job.funds };
  let updatedComp = await job.updateOne({ $set: compUpdates }).exec();
  if (!updatedComp) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
  }

  // Update User
  let userUpdates: IUserUpdates = {
    xp: user.xp + 1,
    health: user.health - 10,
    wallet: [...user.wallet],
    canWork: new Date(new Date().setUTCHours(24, 0, 0, 0)),
  };

  if (userUpdates.xp >= neededXP(user.level)) {
    userUpdates.level = user.level + 1;
    userUpdates.gold = roundMoney(user.gold + 5.0);
    userUpdates.alerts = [...user.alerts, buildLevelUpAlert(userUpdates.level)];
  }

  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Received +1 XP and salary' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function collect_rewards(user_id: number): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();

  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (new Date(user.canCollectRewards) > new Date(Date.now())) {
    return { status_code: 400, payload: { success: false, error: 'You\'ve Already Collected Daily Rewards Today' } };
  }

  let updates: IUserUpdates = {
    xp: user.xp + 1,
    canCollectRewards: new Date(new Date().setUTCHours(24, 0, 0, 0)),
  }

  if (updates.xp >= neededXP(user.level)) {
    updates.level = user.level + 1;
    updates.gold = roundMoney(user.gold + 5.0);
    updates.alerts = [...user.alerts, buildLevelUpAlert(updates.level)];
  }

  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true, message: 'Received bonus +1 XP' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function read_alert({ user_id, alert_index }: IHandleAlertParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 500, payload: { success: false, error: 'User Not Found' } };
  } else if (alert_index < 0 || alert_index > (user.alerts.length - 1)) {
    return { status_code: 500, payload: { success: false, error: 'Invalid Alert' } };
  }

  user.alerts[alert_index].read = true;
  let updates = { alerts: [...user.alerts] };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

// TODO: Handle deleting pending friend requests to cancel them
async function delete_alert({ user_id, alert_index }: IHandleAlertParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 500, payload: { success: false, error: 'User Not Found' } };
  } else if (alert_index < 0 || alert_index > (user.alerts.length - 1)) {
    return { status_code: 500, payload: { success: false, error: 'Invalid Alert' } };
  }

  user.alerts.splice(alert_index, 1);
  let updates = { alerts: [...user.alerts] };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function send_fr({ user_id, profile_id }: ISendFRParams): Promise<IUserActionResult> {
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

  let alert: IAlert = {
    read: false,
    type: UserActions.SEND_FR,
    message: `You've received a friend request from ${user.username}`,
    from: user_id,
    timestamp: new Date(Date.now()),
  };

  let profileUpdates = { alerts: [...profile.alerts, alert] };
  let updatedProfile = await profile.updateOne({ $set: profileUpdates });
  if (!updatedProfile) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong'} };
  }

  let updates = { pendingFriends: [...user.pendingFriends, profile_id] };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function accept_fr({ user_id, alert_index }: IHandleAlertParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (alert_index < 0 || alert_index > (user.alerts.length - 1)) {
    return { status_code: 400, payload: { success: false, error: 'Invalid Alert' } };
  }

  const alert = user.alerts[alert_index];
  user.alerts[alert_index].read = true;
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

  let frIndex = profile.pendingFriends.findIndex(pfr => pfr === user_id);
  profile.pendingFriends.splice(frIndex, 1);

  let profileUpdates = {
    pendingFriends: [...profile.pendingFriends],
    friends: [...profile.friends, user_id],
  };
  let updatedProfile = await profile.updateOne({ $set: profileUpdates }).exec();
  if (!updatedProfile) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
  }

  let updates = { friends: [...user.friends, profile_id], alerts: [...user.alerts] };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated) {
    return { status_code: 200, payload: { success: true, message: 'Friend Added' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function buy_item({ user_id, company_id, offer_id, quantity }: IBuyItemParams): Promise<IUserActionResult> {
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

  // Get Offer and remove items
  let offerIndex = company.productOffers.findIndex(offer => offer?.id === offer_id);
  let productID = -1;
  if (offerIndex === -1) {
    return { status_code: 400, payload: { success: false, error: 'Offer Not Found' } };
  } else if (company.productOffers[offerIndex].quantity < quantity) {
    return { status_code: 400, payload: { success: false, error: 'Company Has Insufficient Quantity' } };
  } else if (company.productOffers[offerIndex].quantity === quantity) {
    productID = company.productOffers[offerIndex].product_id;
    company.productOffers.splice(offerIndex, 1);
  } else {
    company.productOffers[offerIndex].quantity -= quantity;
    productID = company.productOffers[offerIndex].product_id;
  }

  // Subtract Cost From User
  let userCCIndex = user.wallet.findIndex(cc => cc.currency === country.currency);
  let cost = roundMoney(quantity * company.productOffers[offerIndex].price);
  if (userCCIndex === -1 || user.wallet[userCCIndex].amount < cost) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Funds' } };
  } else if (roundMoney(user.wallet[userCCIndex].amount) > cost) {
    user.wallet[userCCIndex].amount = roundMoney(user.wallet[userCCIndex].amount - cost);
  } else {
    user.wallet.splice(userCCIndex, 1);
  }

  // Add Cost to Company
  let compCCIndex = company.funds.findIndex(cc => cc.currency === country.currency);
  if (compCCIndex === -1) {
    company.funds.push({ currency: country.currency, amount: cost });
  } else {
    company.funds[compCCIndex].amount = roundMoney(company.funds[compCCIndex].amount + cost);
  }

  // Add Items to User Inventory
  let itemIndex = user.inventory.findIndex(item => item.item_id === productID);
  if (itemIndex === -1) {
    user.inventory.push({ item_id: productID, quantity });
  } else {
    user.inventory[itemIndex].quantity += quantity;
  }

  // Update Company and User
  let compUpdates = { productOffers: [...company.productOffers], funds: [...company.funds] };
  let updatedComp = await company.updateOne({ $set: compUpdates }).exec();
  if (!updatedComp) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
  }

  let userUpdates = { wallet: [...user.wallet], inventory: [...user.inventory] };
  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Items Purchased' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function send_shout({ user_id, shout }: ICreateShoutParams): Promise<IUserActionResult> {
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

async function like_shout({ user_id, shout_id }: IHandleShoutParams): Promise<IUserActionResult> {
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

  let shoutUpdates = { likes: [...shout.likes, user._id] };
  let updatedShout = await shout.updateOne({ $set: shoutUpdates }).exec();
  if (updatedShout) {
    return { status_code: 200, payload: { success: true, message: 'Shout Liked' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function unlike_shout({ user_id, shout_id }: IHandleShoutParams): Promise<IUserActionResult> {
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
  } else {
    shout.likes.splice(likeIndex, 1);
  }

  let shoutUpdates = { likes: [...shout.likes] };
  let updatedShout = await shout.updateOne({ $set: shoutUpdates }).exec();
  if (updatedShout) {
    return { status_code: 200, payload: { success: true, error: 'Shout Unliked' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

// TODO: Filter for malicious text
async function update_desc({ user_id, desc }: IUpdateDescParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };

  let userUpdates = { description: desc };
  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Description Updated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_username({ user_id, username }: IUpdateUsernameParams): Promise<IUserActionResult> {
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

  let userUpdates = { username, gold: roundMoney(user.gold - 25) };
  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Username Updated' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function update_password({ user_id, currPw, newPw }: IUpdatePwParams): Promise<IUserActionResult> {
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

async function travel({ user_id, region_id }: ITravelParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user.location === region_id)
    return { status_code: 400, payload: { success: false, error: 'Already Located In Region' } };

  let regions: IRegion[] = await Region.find({}).exec();
  let travel_info = getDistance(regions, user.location, region_id);

  if (user.gold < travel_info.cost)
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };

  let userUpdates = { gold: roundMoney(user.gold - travel_info.cost), location: region_id };
  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Successfully Relocated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function upload({ user_id, image }: IUploadImageParams): Promise<IUserActionResult> {
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

async function donate_funds({ user_id, profile_id, gold, funds }: IDonateParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  
  let profile: IUser = await User.findOne({ _id: profile_id }).exec();
  if (!profile)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user._id === profile._id)
    return { status_code: 400, payload: { success: false, error: 'You Cannot Donate To Yourself'} };
  
  if (gold && user.gold >= gold) {
    user.gold = roundMoney(user.gold - gold);
    profile.gold = roundMoney(profile.gold + gold);
  } else if (gold) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };
  }

  if (funds) {
    let userCCIndex = user.wallet.findIndex(cc => cc.currency === funds.currency);
    if (userCCIndex > -1 && user.wallet[userCCIndex].amount >= funds.amount) {
      user.wallet[userCCIndex].amount = roundMoney(user.wallet[userCCIndex].amount - funds.amount);
      let profileCCIndex = profile.wallet.findIndex(cc => cc.currency === funds.currency);
      if (profileCCIndex === -1)
        profile.wallet.push(funds);
      else
        profile.wallet[profileCCIndex].amount = roundMoney(profile.wallet[profileCCIndex].amount + funds.amount);
    } else {
      return { status_code: 400, payload: { success: false, error: 'Insufficient Currency' } };
    }
  }

  let message: string = '';
  if (gold && funds) {
    message = `You have received ${gold.toFixed(2)} gold and ${funds.amount.toFixed(2)} ${funds.currency} from ${user.username}`;
  } else if (funds) {
    message = `You have received ${funds.amount.toFixed(2)} ${funds.currency} from ${user.username}`;
  } else {
    message = `You have received ${gold.toFixed(2)} gold from ${user.username}`;
  }

  let donateAlert = {
    read: false,
    type: UserActions.DONATE,
    message,
    timestamp: new Date(Date.now()),
  };

  let profileUpdates = { gold: profile.gold, wallet: [...profile.wallet], alerts: [...profile.alerts, donateAlert] };
  let userUpdates = { gold: user.gold, wallet: [...user.wallet] };
  let updatedProfile = await profile.updateOne({ $set: profileUpdates }).exec();
  if (!updatedProfile)
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, error: 'Funds Donated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function gift_items({ user_id, profile_id, items }: IGiftParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  
  let profile: IUser = await User.findOne({ _id: profile_id }).exec();
  if (!profile)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user._id === profile._id)
    return { status_code: 400, payload: { success: false, error: 'You Cannot Send Gifts To Yourself'} };

  console.log('ITEMS:', items);

  let hasError: boolean = false;
  for (let item of items) {
    let idx = user.inventory.findIndex(i => i.item_id === item.item_id);
    if (idx === -1 || user.inventory[idx].quantity < item.quantity) {
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

  if (hasError)
    return { status_code: 400, payload: { success: false, error: 'Insufficient Items' } };

  let giftAlert = {
    read: false,
    type: UserActions.GIFT,
    message: `You've been gifted items from ${user.username}`,
    timestamp: new Date(Date.now()),
  };

  let profUpdates = { inventory: [...profile.inventory], alerts: [...profile.alerts, giftAlert] };
  let userUpdates = { inventory: [...user.inventory] };
  let updatedProf = await profile.updateOne({ $set: profUpdates }).exec();
  if (!updatedProf)
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Items Gifted' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function create_thread(data: ICreateThreadParams): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };

  let { participants } = data;
  participants.push(data.user_id);

  let msg: IMsg = { from: data.user_id, message: data.message, timestamp: data.timestamp };
  let threadId: string = '';
  try {
    const { randomBytes } = await import('crypto');
    randomBytes(10, (err, buf) => {
      if (err) throw err;
      threadId = buf.toString('hex');
    });
  } catch (e) {
    return { status_code: 500, payload: { success: false, error: 'Failed to Generate Thread ID' } };
  }

  let hasAll: boolean = true;
  for (let i = 0; i < participants.length; i++) {
    let uid = participants[i];
    let participant = await User.findOne({ _id: uid }).exec();

    if (!participant) {
      hasAll = false;
      continue;
    }

    participant.messages.push({
      id: threadId,
      participants,
      subject: data.subject,
      messages: [msg],
      timestamp: data.timestamp,
      read: uid === data.user_id,
    });

    let updates = { messages: [...participant.messages] };
    let updated = await participant.updateOne({ $set: updates }).exec();
    if (!updated)
      hasAll = false;
  }

  if (hasAll)
    return { status_code: 200, payload: { success: true, message: 'Message Sent' } };
  
  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function read_thread(data: IHandleThread): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };

  let msgIdx = user.messages.findIndex(thread => thread.id === data.thread_id);
  if (msgIdx === -1)
    return { status_code: 400, payload: { success: false, error: 'Thread Not Found' } };

  user.messages[msgIdx].read = true;
  let updates = { messages: [...user.messages] };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Thread Marked As Read' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function delete_thread(data: IHandleThread): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };

  let msgIdx = user.messages.findIndex(thread => thread.id === data.thread_id);
  if (msgIdx === -1)
    return { status_code: 400, payload: { success: false, error: 'Thread Not Found' } };

  user.messages.splice(msgIdx, 1);
  let updates = { messages: [...user.messages] };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Tread Deleted' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function send_msg(data: ISendMsg): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };

  let threadIdx: number = user.messages.findIndex(thread => thread.id === data.thread_id);
  if (threadIdx === -1)
    return { status_code: 404, payload: { success: false, error: 'Mail Thread Not Found' } };
  
  let allUpdated: boolean = true;
  for (let participant_id of user.messages[threadIdx].participants) {
    let participant: IUser = await User.findOne({ _id: participant_id }).exec();
    if (!participant) {
      allUpdated = false;
      continue;
    }

    let pThreadIdx: number = participant.messages.findIndex(thread => thread.id === data.thread_id);
    if (pThreadIdx === -1) {
      allUpdated = false;
      continue;
    }

    if (participant_id !== user._id)
      participant.messages[pThreadIdx].read = false;
    
    participant.messages[pThreadIdx].messages.push({
      from: user._id,
      message: data.message,
      timestamp: new Date(data.timestamp),
    });

    let updates = { messages: [...participant.messages] };
    let updated = await participant.updateOne({ $set: updates }).exec();

    if (!updated)
      allUpdated = false;
  }

  if (allUpdated)
    return { status_code: 200, payload: { success: true, message: 'Message Sent' } };

  return { status_code: 500, payload: { success: false, error: 'Not All Participants Received Message' } };
}

async function create_news(data: ICreateNewspaper): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user.gold < 5)
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };

  let news_id: number = await Newspaper.estimatedDocumentCount() + 1;
  let newspaper = new Newspaper({ _id: news_id, author: user._id, name: data.name });
  let created = await newspaper.save();
  if (!created)
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  let updates = { gold: roundMoney(user.gold - 5), newspaper: created._id };
  let updated = await user.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, newspaper: created._id, message: 'Newspaper Created' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function like_article(data: ILikeArticle): Promise<IUserActionResult> {
  let newspaper: INewspaper = await Newspaper.findOne({ _id: data.newsId }).exec();
  if (!newspaper)
    return { status_code: 404, payload: { success: false, error: 'Newspaper Not Found' } };
  
  let articleIndex = newspaper.articles.findIndex(a => a.id === data.articleId);
  if (articleIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Article Not Found' } };

  let likeIndex = newspaper.articles[articleIndex].likes.findIndex(userId => userId === data.user_id);
  if (likeIndex === -1) {
    newspaper.articles[articleIndex].likes.push(data.user_id);
  } else {
    newspaper.articles[articleIndex].likes.splice(likeIndex, 1);
  }

  let updates = { articles: [...newspaper.articles ] };
  let updated = await newspaper.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: likeIndex === -1 ? 'Article Liked' : 'Article Unliked' } };
}

async function subscribe_news(data: ISubscribeNews): Promise<IUserActionResult> {
  let newspaper: INewspaper = await Newspaper.findOne({ _id: data.newsId }).exec();
  if (!newspaper)
    return { status_code: 404, payload: { success: false, error: 'Newspaper Not Found' } };

  let subscriberIndex = newspaper.subscribers.findIndex(userId => userId === data.user_id);
  if (subscriberIndex === -1) {
    newspaper.subscribers.push(data.user_id);
  } else {
    newspaper.subscribers.splice(subscriberIndex, 1);
  }

  let updates = { subscribers: [...newspaper.subscribers ] };
  let updated = await newspaper.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: subscriberIndex === -1 ? 'Newspaper Subscribed' : 'Newspaper Unsubscribed' } };
}

async function run_for_cp(data: IRunForOffice): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  let party: IParty = await Party.findOne({ _id: data.partyId }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Political Party Not Found' } };
  else if (party.president === user._id)
    return { status_code: 400, payload: { success: false, error: 'Party President Cannot Run For Office' } };
  else if (!party.members.includes(user._id))
    return { status_code: 400, payload: { success: false, error: 'You Are Not A Party Member' } };
  else if (party.cpCandidates.findIndex(can => can.id === user._id) >= 0)
    return { status_code: 400, payload: { success: false, error: 'You Are Already A Candidate' } };

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

  party.cpCandidates.push(candidate);

  let updatedParty = await party.save();
  if (updatedParty)
    return { status_code: 200, payload: { success: true, message: 'Candidacy Submitted' } };

  return { status_code: 500, payload: { success: true, error: 'Something Went Wrong' } };
}

async function join_party(data: IHandlePartyMembership): Promise<IUserActionResult> {
  let party: IParty = await Party.findOne({ _id: data.partyId }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (party.members.includes(data.user_id))
    return { status_code: 400, payload: { success: false, error: 'User Already A Party Member' } };

  // Update Party
  party.members.push(data.user_id);
  let updatedParty = await party.save();
  if (!updatedParty)
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  // Update User
  let updatedUser = await User.updateOne({ _id: data.user_id }, { $set: { party: party._id } }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Successfully Joined Party' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function leave_party(data: IHandlePartyMembership): Promise<IUserActionResult> {
  // Prevent Leaving Party During An Election
  let now = new Date(Date.now());
  switch (now.getUTCDate()) {
    case 5:
    case 15:
    case 25:
      return { status_code: 400, payload: { success: false, error: 'Cannot Leave Party During Elections' } };
    default:
      break;
  }

  // Validate Party Membership
  let party: IParty = await Party.findOne({ _id: data.partyId }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (!party.members.includes(data.user_id))
    return { status_code: 400, payload: { success: false, error: 'User Already Not A Member' } };

  // Update Party
  party.members.splice(party.members.indexOf(data.user_id), 1);
  let updatedParty = await party.save();
  if (!updatedParty)
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };

  // Update User
  let updatedUser = await User.updateOne({ _id: data.user_id }, { $set: { party: 0 } }).exec();
  if (updatedUser)
    return { status_code: 200, payload: { success: true, message: 'Successfully Left Party' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

// TODO: Handle Congress & Party President Elections
async function vote(data: IHandleVote): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (data.location !== user.residence)
    return { status_code: 400, payload: { success: false, error: 'You can only vote from your region of residence' } };

  let election: IElection = await Election.findOne({ _id: data.election }).exec();
  if (!election)
    return { status_code: 404, payload: { success: false, error: 'Election Not Found' } };

  let hasVoted: boolean = false;

  for (let candidate of election.candidates) {
    if (candidate.votes.findIndex(vote => findVote(vote, data.user_id)) >= 0) {
      hasVoted = true;
      break;
    }
  }

  if (hasVoted)
    return { status_code: 400, payload: { success: false, error: 'You\'ve Already Voted' } };

  try {
    switch (election.type) {
      case ElectionType.CountryPresident: {
        let candidateIndex: number = election.candidates.findIndex(can => can.id === data.candidate);
        if (candidateIndex === -1)
          return { status_code: 404, payload: { success: false, error: 'Candidate Not Found' } };

        if (election.system === ElectionSystem.ElectoralCollege) {
          let voteIndex: number = (election.candidates[candidateIndex].votes as ECVote[])
            .findIndex((ecVote: ECVote) => ecVote.location === data.location);
          
          if (voteIndex === -1) {
            (election.candidates[candidateIndex].votes as ECVote[]).push({
              location: data.location,
              tally: [data.user_id],
            } as ECVote);
            break;
          } else {
            (election.candidates[candidateIndex].votes[voteIndex] as ECVote)?.tally.push(data.user_id);
            break;
          }
        } else if (election.system === ElectionSystem.PopularVote) {
          // Dont need a check if voted here, since done above
          (election.candidates[candidateIndex].votes as number[]).push(data.user_id);
          break;
        }
      }
      case ElectionType.Congress:
      case ElectionType.PartyPresident:
      default:
        return { status_code: 400, payload: { success: false, error: 'Unknown Election Type' } };
    }
  } catch (e: any) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
  }

  let updatedElection = await election.updateOne({ $set: { candidates: election.candidates }});

  if (updatedElection)
    return { status_code: 200, payload: { success: true, message: 'Vote Submitted' } };
}

async function run_for_congress(data: IRunForOffice): Promise<IUserActionResult> {
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };

  let residence: IRegion = await Region.findOne({ _id: user.residence }).exec();
  if (!residence)
    return { status_code: 404, payload: { success: false, error: 'Residence Region Not Found' } };
  
  let party: IParty = await Party.findOne({ _id: data.partyId }).exec();
  if (!party)
    return { status_code: 404, payload: { success: false, error: 'Party Not Found' } };
  else if (!party.members.includes(user._id))
    return { status_code: 400, payload: { success: false, error: 'You Are Not A Party Member' } };
  else if (party.president === user._id)
    return { status_code: 400, payload: { success: false, error: 'Party Presidents Cannot Run For Congress' } };
  else if (party.congressCandidates.findIndex(can => can.id === user._id) >= 0)
    return { status_code: 400, payload: { success: false, error: 'Already A Congress Candidate' } };

  let country: ICountry = await Country.findOne({ _id: party.country }).exec();
  if (!country)
    return { status_code: 404, payload: { success: false, error: 'Country Not Found' } };
  else if (country.government.president === user._id)
    return { status_code: 400, payload: { success: false, error: 'Country Presidents Cannot Run For Congress' } };

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
  if (!election)
    return { status_code: 404, payload: { success: false, error: 'Congress Election Not Found' } };

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

  party.congressCandidates.push(candidate);
  let updatedParty = await party.save();
  if (updatedParty)
    return { status_code: 200, payload: { success: true, message: 'Candidacy Submitted' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function move_residence({ user_id, region_id }: ITravelParams): Promise<IUserActionResult> {
  let now = new Date(Date.now());
  switch (now.getUTCDate()) {
    case 5:
    case 25:
      return { status_code: 400, payload: { success: false, error: 'Cannot Change Residence During Presidential or Congressional Elections' } };
    default:
      break;
  }

  let user: IUser = await User.findOne({ _id: user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  
  let region: IRegion = await Region.findOne({ _id: region_id, owner: user.country }).exec();
  if (!region)
    return { status_code: 404, payload: { success: false, error: 'Region Not Found Or Invalid Region For Relocation' } };

  if (region.owner !== user.country)
    return { status_code: 400, payload: { success: false, error: 'Residence Region Owner Must Match Citizenship' } };

  let updated = await user.updateOne({ $set: { residence: region_id } }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Residence Updated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}