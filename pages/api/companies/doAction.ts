import Company, { ICompany, IEmployee, IJobOffer, IProductOffer } from '@/models/Company';
import Region, { IRegion } from '@/models/Region';
import User, { IUser } from '@/models/User';
import { CompanyActions } from '@/util/actions';
import { getDistance, roundMoney } from '@/util/apiHelpers';
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
    IHandleFundsParams | IEditEmployeeParams | IFireEmployeeParams | IRelocateParams |
    IUploadLogoParams | IUpdateNameParams
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

interface IEditEmployeeParams extends IBaseParams {
  employee: {
    user_id: number,
    title?: string,
    wage?: number,
  }
}

interface IFireEmployeeParams extends IBaseParams {
  employee_id: number
}

interface IUpdateNameParams extends IBaseParams {
  name: string
}

interface IRelocateParams extends IBaseParams {
  region_id: number
}

interface IUploadLogoParams extends IBaseParams {
  image: any
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
        case CompanyActions.EDIT_EMPLOYEE: {
          result = await edit_employee(data as IEditEmployeeParams);
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
        case CompanyActions.FIRE_EMPLOYEE: {
          result = await fire_employee(data as IFireEmployeeParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.RELOCATE: {
          result = await relocate(data as IRelocateParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.UPDATE_NAME: {
          result = await update_name(data as IUpdateNameParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.UPLOAD_LOGO: {
          result = await upload(data as IUploadLogoParams);
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

const edit_employee = async (data: IEditEmployeeParams): Promise<ICompanyActionResult> => {
  const user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }

  const company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company) {
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  } else if (company.ceo !== user._id) {
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };
  }

  let employeeIndex = company.employees.findIndex(emp => emp.user_id === data.employee.user_id);
  if (employeeIndex === -1) {
    return { status_code: 400, payload: { success: false, error: 'User Is Not An Employee' } };
  }

  if (data.employee?.title && data.employee.title !== company.employees[employeeIndex].title)
    company.employees[employeeIndex].title = data.employee.title;

  if (data.employee?.wage && data.employee.wage !== company.employees[employeeIndex].wage)
    company.employees[employeeIndex].wage = data.employee.wage;

  let compUpdates = { employees: [...company.employees] };
  let updatedComp = await company.updateOne({ $set: compUpdates }).exec();
  if (updatedComp) {
    return { status_code: 200, payload: { success: true, message: 'Employee Updated' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const fire_employee = async (data: IFireEmployeeParams): Promise<ICompanyActionResult> => {
  const user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user) {
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  }

  const company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company) {
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  } else if (company.ceo !== user._id) {
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };
  }

  let employeeIndex = company.employees.findIndex(emp => emp.user_id === data.employee_id);
  if (employeeIndex === -1) {
    return { status_code: 400, payload: { success: false, error: 'User Is Not An Employee' } };
  }

  company.employees.splice(employeeIndex, 1);
  let compUpdates = { employees: [...company.employees] };
  let updatedComp = await company.updateOne({ $set: compUpdates }).exec();
  if (updatedComp) {
    return { status_code: 200, payload: { success: true, message: 'Employee Fired' } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const update_name = async (data: IUpdateNameParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company)
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };

  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user._id !== company.ceo)
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };

  let exists: ICompany = await Company.findOne({ name: data.name }).exec();
  if (exists)
    return { status_code: 400, payload: { success: false, error: 'Company Name Already Taken' } };

  let compUpdates = { name: data.name };
  let updatedComp = await company.updateOne({ $set: compUpdates }).exec();
  if (updatedComp)
    return { status_code: 200, payload: { success: true, message: 'Comany Name Updated' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const relocate = async (data: IRelocateParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company)
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user._id !== company.ceo)
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };
  else if (company.location === data.region_id)
    return { status_code: 400, payload: { success: false, error: 'Already Located In Region' } };

  let regions: IRegion[] = await Region.find({}).exec();
  let travel_info = getDistance(regions, company.location, data.region_id);

  if (company.gold < travel_info.cost)
    return { status_code: 400, payload: { success: false, error: 'Insufficient Gold' } };
  
  let compUpdates = { gold: roundMoney(company.gold - travel_info.cost), location: data.region_id };
  let updatedComp = await company.updateOne({ $set: compUpdates }).exec();
  if (updatedComp)
    return { status_code: 200, payload: { success: true, message: 'Company Relocated' } };
  
  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

const upload = async (data: IUploadLogoParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company)
    return { status_code: 404, payload: { success: false, error: 'Company Not Found' } };
  
  let user: IUser = await User.findOne({ _id: data.user_id }).exec();
  if (!user)
    return { status_code: 404, payload: { success: false, error: 'User Not Found' } };
  else if (user._id !== company.ceo)
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };
  else if (!data.image)
    return { status_code: 400, payload: { success: false, error: 'Invalid Base64 Image' } };

  let updatedComp = await company.updateOne({ $set: { image: data.image } }).exec();
  if (updatedComp)
    return { status_code: 200, payload: { success: true, message: 'Logo Uploaded' } };
  
  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}