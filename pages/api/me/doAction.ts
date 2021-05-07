import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";
import { UserActions } from '@/util/actions';
import User, { IAlert, IUser, IUserUpdates, IWalletItem } from "@/models/User";
import { neededXP } from "@/util/ui";
import { buildLevelUpAlert, roundMoney } from "@/util/apiHelpers";
import { connectToDB } from "@/util/mongo";
import Company, { ICompany, IEmployee } from "@/models/Company";
import Region, { IRegion } from "@/models/Region";
import Country, { ICountry } from "@/models/Country";
import Shout, { IShout } from "@/models/Shout";

interface IUserActionResult {
  status_code: number,
  payload : {
    success: boolean,
    error?: string,
    message?: string,
  },
}

interface IRequestBody {
  action: string,
  data?: IApplyJobParams | IHandleAlertParams | ISendFRParams | IBuyItemParams |
    ICreateShoutParams | IHandleShoutParams
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
        case UserActions.DELETE_ALERT: {
          result = await delete_alert(data as IHandleAlertParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.HEAL: {
          result = await heal(user_id);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.LIKE_SHOUT: {
          result = await like_shout(data as IHandleShoutParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.READ_ALERT: {
          result = await read_alert(data as IHandleAlertParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.SEND_FR: {
          result = await send_fr(data as ISendFRParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.SEND_SHOUT: {
          result = await send_shout(data as ICreateShoutParams);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.TRAIN: {
          result = await train(user_id);
          return res.status(result.status_code).json(result.payload);
        }
        case UserActions.UNLIKE_SHOUT: {
          result = await unlike_shout(data as IHandleShoutParams);
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
  });
  new_shout.save();

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