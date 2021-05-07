import Company, { ICompany, IJobOffer, IProductOffer } from '@/models/Company';
import User, { IUser } from '@/models/User';
import { CompanyActions } from '@/util/actions';
import { roundMoney } from '@/util/apiHelpers';
import { validateToken } from '@/util/auth';
import { connectToDB } from '@/util/mongo';
import { NextApiRequest, NextApiResponse } from 'next';


interface ICompanyActionResult {
  status_code: number,
  payload: {
    success: boolean,
    error?: string,
    message?: string,
  },
}

interface IRequestBody {
  action: string,
  data: ICreateJobParams | IProductParams | IDeleteJobParams | IEditJobParams |
    IHandleFundsParams
}

interface IBaseParams {
  user_id?: number,
  company_id: number,
}

interface ICreateJobParams extends IBaseParams {
  offer: IJobOffer,
}

interface IProductParams extends IBaseParams {
  offer: IProductOffer,
}

interface IDeleteJobParams extends IBaseParams {
  job_id: string,
}

interface IEditJobParams extends IBaseParams {
  offer: IJobOffer
}

interface IHandleFundsParams extends IBaseParams {
  gold?: number
  funds?: {
    currency: string,
    amount: number,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(401).json({ error: validation_res.error });
  }

  switch (req.method) {
    case 'POST': {
      const { user_id } = validation_res;
      const { action, data } = JSON.parse(req.body) as IRequestBody;
      data.user_id = user_id;
      let result: ICompanyActionResult;

      // Ensure DB Conn
      await connectToDB();

      switch (action) {
        case CompanyActions.CREATE_JOB: {
          result = await create_job(data as ICreateJobParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.CREATE_PRODUCT: {
          result = await create_product(data as IProductParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.DELETE_JOB: {
          result = await delete_job(data as IDeleteJobParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.DELETE_PRODUCT: {
          result = await delete_product(data as IProductParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.DEPOSITE_FUNDS: {
          result = await deposit_funds(data as IHandleFundsParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.EDIT_JOB: {
          result = await edit_job(data as IEditJobParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.EDIT_PRODUCT: {
          result = await edit_product(data as IProductParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.WITHDRAW_FUNDS: {
          result = await withdraw_funds(data as IHandleFundsParams);
          return res.status(result.status_code).json(result.payload);
        }
        default:
          return res.status(400).json({ error: 'Unhandled HTTP Method' });
      }
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

const create_job = async (data: ICreateJobParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  
  if (!company || company.ceo !== data.user_id) {
    // invalid company
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };
  }

  // Create Job Offer
  try {
    const { randomBytes } = await import('crypto');
    let buf = await randomBytes(10);
    data.offer.id = buf.toString('hex');
    console.log('Created Job ID:', data.offer.id);
    let updates = { jobOffers: [...company.jobOffers, data.offer] };

    let updated = await company.updateOne({ $set: { ...updates }});
    if (updated) {
      return { status_code: 200, payload: { success: true } };
    }
  } catch (e) {
    return { status_code: 500, payload: { success: false, error: 'Failed to generate offer id' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const create_product = async (data: IProductParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();

  if (!company || company.ceo !== data.user_id)
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };

  // Check that company has enough quantity then remove
  let itemIndex = company.inventory.findIndex(item => item.item_id === data.offer.product_id);
  if (itemIndex < 0 || (company.inventory[itemIndex].quantity < data.offer.quantity)) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Quantity In Inventory' } };
  } else if (company.inventory[itemIndex].quantity === data.offer.quantity) {
    company.inventory.splice(itemIndex, 1);
  } else {
    company.inventory[itemIndex].quantity -= data.offer.quantity;
  }

  // Create Product Offer
  try {
    const { randomBytes } = await import('crypto');
    randomBytes(10, (err, buf) => {
      if (err) throw err;
      data.offer.id = buf.toString('hex');
    });
  } catch (e) {
    return { status_code: 500, payload: { success: false, error: 'Failed to generate offer id' } };
  }

  let updates = { productOffers: [...company.productOffers, data.offer], inventory: [...company.inventory] };

  let updated = await company.updateOne({ $set: { ...updates } });
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const delete_job  = async (data: IDeleteJobParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company || company.ceo !== data.user_id)
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };

  let jobIndex = company.jobOffers.findIndex(offer => offer.id === data.job_id);
  if (jobIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Job Offer Not Found' } };
  
  company.jobOffers.splice(jobIndex, 1);
  let updates = { jobOffers: [...company.jobOffers] };
  let updated = await company.updateOne({ $set: { ...updates } });
  if (updated) {
    return { status_code: 200, payload: { success: true, message: 'Job Offer Revoked' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const delete_product = async (data: IProductParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company || company.ceo !== data.user_id)
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };

  let productIndex = company.productOffers.findIndex(offer => offer?.id === data.offer?.id);
  if (productIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Product Offer Not Found' } };

  let itemIndex = company.inventory.findIndex(item => item.item_id === data.offer.product_id);
  if (itemIndex === -1) {
    company.inventory.push({ item_id: data.offer.product_id, quantity: data.offer.quantity });
  } else {
    company.inventory[itemIndex].quantity += data.offer.quantity;
  }

  company.productOffers.splice(productIndex, 1);
  let updates = { productOffers: [...company.productOffers], inventory: [...company.inventory] };
  let updated = await company.updateOne({ $set: { ...updates } });
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Product Offer Revoked' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const edit_job = async (data: IEditJobParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company || company.ceo !== data.user_id)
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };

  let jobIndex = company.jobOffers.findIndex(offer => offer.id === data.offer.id);
  if (jobIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Job Offer Not Found' } };
  
  company.jobOffers.splice(jobIndex, 1, data.offer);
  let updates = { jobOffers: [...company.jobOffers] };
  let updated = await company.updateOne({ $set: { ...updates } });
  if (updated) {
    return { status_code: 200, payload: { success: true, message: 'Job Offer Updated' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const edit_product = async (data: IProductParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company || company.ceo !== data.user_id)
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };

  let productIndex = company.productOffers.findIndex(offer => offer.id !== data.offer.id);
  if (productIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Product Offer Not Found' } };

  company.productOffers.splice(productIndex, 1, data.offer);
  let updates = { productOffers: [...company.productOffers] };
  let updated = await company.updateOne({ $set: { ...updates } });
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Product Offer Updated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const deposit_funds = async (data: IHandleFundsParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company) {
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  }

  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (user._id !== company.ceo) {
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };
  }

  if (data?.gold && user.gold >= data?.gold) {
    user.gold = roundMoney(user.gold - data?.gold);
    company.gold = roundMoney(company.gold + data?.gold);
  } else if (data?.gold) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };
  }

  if (data?.funds) {
    let userCCIndex = user.wallet.findIndex(cc => cc.currency === data.funds.currency);
    if (userCCIndex > -1 && user.wallet[userCCIndex].amount >= data.funds.amount) {
      user.wallet[userCCIndex].amount = roundMoney(user.wallet[userCCIndex].amount - data.funds.amount);
      let compCCIndex = company.funds.findIndex(cc => cc.currency === data.funds.currency);
      if (compCCIndex === -1) {
        company.funds.push(data.funds);
      } else {
        company.funds[compCCIndex].amount = roundMoney(company.funds[compCCIndex].amount + data.funds.amount);
      }
    } else {
      return { status_code: 400, payload: { success: false, error: 'Insufficient Currency' } };
    }
  }

  let compUpdates = { gold: company.gold, funds: [...company.funds] };
  let userUpdates = { gold: user.gold, wallet: [...user.wallet] };
  let updatedComp = await company.updateOne({ $set: compUpdates }).exec();
  if (!updatedComp) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
  }

  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Funds Deposited' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const withdraw_funds = async (data: IHandleFundsParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company) {
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  }

  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  } else if (user._id !== company.ceo) {
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };
  }

  if (data?.gold && company.gold >= data?.gold) {
    user.gold = roundMoney(user.gold + data?.gold);
    company.gold = roundMoney(company.gold - data?.gold);
  } else if (data?.gold) {
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };
  }

  if (data?.funds) {
    let compCCIndex = company.funds.findIndex(cc => cc.currency === data.funds.currency);    
    if (compCCIndex > -1 && company.funds[compCCIndex].amount >= data.funds.amount) {
      company.funds[compCCIndex].amount = roundMoney(company.funds[compCCIndex].amount - data.funds.amount);
      let userCCIndex = user.wallet.findIndex(cc => cc.currency === data.funds.currency);
      if (userCCIndex === -1) {
        user.wallet.push(data.funds);
      } else {
        user.wallet[userCCIndex].amount = roundMoney(user.wallet[userCCIndex].amount + data.funds.amount);
      }
    } else {
      return { status_code: 400, payload: { success: false, error: 'Insufficient Currency' } };
    }
  }

  let compUpdates = { gold: company.gold, funds: [...company.funds] };
  let userUpdates = { gold: user.gold, wallet: [...user.wallet] };
  let updatedComp = await company.updateOne({ $set: compUpdates }).exec();
  if (!updatedComp) {
    return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
  }

  let updatedUser = await user.updateOne({ $set: userUpdates }).exec();
  if (updatedUser) {
    return { status_code: 200, payload: { success: true, message: 'Funds Withdrawn' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}