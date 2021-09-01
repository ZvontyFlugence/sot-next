import Company, { ICompany, IEmployee, IJobOffer, IProductOffer } from '@/models/Company';
import Region, { IRegion } from '@/models/Region';
import User, { IUser } from '@/models/User';
import { CompanyActions } from '@/util/actions';
import { getDistance } from '@/util/apiHelpers';
import { validateToken } from '@/util/auth';
import { connectToDB } from '@/util/mongo';
import { UpdateWriteOpResult } from 'mongoose';
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

interface IMap {
  [key: string]: any;
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

function defaultActionRes(): ICompanyActionResult {
  return {
    status_code: 500,
    payload: {
      success: false,
      error: 'Something Went Wrong',
    },
  };
}

const create_job = async (data: ICreateJobParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();

  try {
    // Validate Company
    let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
    if (!company || company.ceo !== data.user_id) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Company';
      throw new Error(ret.payload.error);
    }

    // Generate Job Offer Id
    const { randomBytes } = await import('crypto');
    let buf = await randomBytes(10);
    data.offer.id = buf.toString('hex');

    // Create Job Offer
    let updated = await company.updateOne({ $addToSet: { jobOffers: data.offer } }).exec();

    if (updated) {
      ret.status_code = 200;
      ret.payload = { success: true, message: 'Job Offer Created' };
    } else {
      throw new Error(ret.payload.error);
    }
  } catch (e: any) {
    console.error(e);
  } finally {
    return ret;
  }
}

const create_product = async (data: IProductParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();

  try {
    // Validate Company
    let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
    if (!company || company.ceo !== data.user_id) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Company';
      throw new Error(ret.payload.error);
    }

    // Check that company has enough quantity then remove
    let itemIndex = company.inventory.findIndex(item => item.item_id === data.offer.product_id);
    if (itemIndex < 0 || (company.inventory[itemIndex].quantity < data.offer.quantity)) {
      ret.status_code = 400;
      ret.payload.error = 'Insufficient Quantity In Inventory';
      throw new Error(ret.payload.error);
    }

    // Create Product Offer
    const { randomBytes } = await import('crypto');
    let buf = await randomBytes(10);
    data.offer.id = buf.toString('hex');

    let updated: UpdateWriteOpResult;
    if (company.inventory[itemIndex].quantity === data.offer.quantity) {
      let updates = {
        $pull: { inventory: { item_id: data.offer.product_id } },
      };

      updated = await company.updateOne(updates).exec();
    } else {
      let query = {
        _id: company._id,
        inventory: { $elemMatch: { item_id: data.offer.product_id } },
      };
      let updates = {
        $addToSet: { productOffers: data.offer },
        $inc: {
          'inventory.$.quantity': -data.offer.quantity,
        },
      };

      updated = await Company.updateOne(query, updates).exec();
    }

    if (updated) {
      ret.status_code = 200;
      ret.payload = { success: true, message: 'Product Offer Created' };
    } else {
      throw new Error(ret.payload.error);
    }
  } catch (e: any) {
    // Temp logging of error
    console.error(e);
  } finally {
    return ret;
  }
}

const delete_job  = async (data: IDeleteJobParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();
  
  try {
    let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
    if (!company || company.ceo !== data.user_id) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Company';
      throw new Error(ret.payload.error);
    }

    let jobIndex = company.jobOffers.findIndex(offer => offer.id === data.job_id);
    if (jobIndex === -1) {
      ret.status_code = 404;
      ret.payload.error = 'Job Offer Not Found';
      throw new Error(ret.payload.error);
    }

    let updated = await company.updateOne({ $pull: { jobOffers: { id: data.job_id } } }).exec();
    if (updated) {
      ret.status_code = 200;
      ret.payload = { success: true, message: 'Job Offer Revoked' };
    } else {
      throw new Error(ret.payload.error);
    }
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

const delete_product = async (data: IProductParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();

  try {
      let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
      if (!company || company.ceo !== data.user_id) {
        ret.status_code = 400;
        ret.payload.error = 'Invalid Company';
        throw new Error(ret.payload.error);
      }
  
      let productIndex = company.productOffers.findIndex(offer => offer?.id === data.offer?.id);
      if (productIndex === -1) {
        ret.status_code = 404;
        ret.payload.error = 'Product Offer Not Found';
        throw new Error(ret.payload.error);
      }
  
      let itemIndex = company.inventory.findIndex(item => item.item_id === data.offer.product_id);
      let updated: UpdateWriteOpResult;

      if (itemIndex === -1) {
        // Item not in Inventory
        let updates = {
          $pull: { productOffers: { id: data.offer?.id } },
          $addToSet: {
            inventory: { item_id: data.offer.product_id, quantity: data.offer.quantity },
          },
        };

        updated = await company.updateOne(updates).exec();
      } else {
        // Item in inventory
        let query = {
          _id: company._id,
          inventory: {
            $elemMatch: { item_id: data.offer.product_id },
          },
        };

        let updates = {
          $pull: { productOffers: { id: data.offer?.id } },
          $inc: { 'inventory.$.quantity': data.offer.quantity },
        };

        updated = await Company.updateOne(query, updates).exec();
      }

      if (updated) {
        ret.status_code = 200;
        ret.payload = { success: true, message: 'Product Offer Revoked' };
      } else {
        throw new Error(ret.payload.error);
      }
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

const edit_job = async (data: IEditJobParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();
  
  try {
    // Validate Company
    let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
    if (!company || company.ceo !== data.user_id) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Company';
      throw new Error(ret.payload.error);
    }

    let jobIndex = company.jobOffers.findIndex(offer => offer.id === data.offer.id);
    if (jobIndex === -1) {
      ret.status_code = 404;
      ret.payload.error = 'Job Offer Not Found';
      throw new Error(ret.payload.error);
    }
    
    let updated = await Company.updateOne({
      _id: company._id,
      jobOffers: { $elemMatch: { id: data.offer.id } },
    }, {
      $set: { 'jobOffers.$': data.offer },
    }).exec();

    if (updated) {
      ret.status_code = 200;
      ret.payload = { success: true, message: 'Job Offer Updated' };
    } else {
      throw new Error(ret.payload.error);
    }
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

const edit_product = async (data: IProductParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();

  try {
    // Validate Company
    let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
    if (!company || company.ceo !== data.user_id) {
      ret.status_code = 400;
      ret.payload.error = 'Invalid Company';
      throw new Error(ret.payload.error);
    }

    let productIndex = company.productOffers.findIndex(offer => offer.id === data.offer.id);
    if (productIndex === -1) {
      ret.status_code = 404;
      ret.payload.error = 'Product Offer Not Found';
      throw new Error(ret.payload.error);
    }

    let updated: UpdateWriteOpResult;
    let oldQuantity: number = company.productOffers[productIndex].quantity;
    if (oldQuantity === data.offer.quantity) {
      // Quantity Isnt Changing
      updated = await Company.updateOne({
        _id: company._id,
        productOffers: { $elemMatch: { id: data.offer.id } },
      }, {
        $set: { 'productOffers.$': data.offer },
      }).exec();
    } else if (company.inventory.findIndex(item => item.item_id === data.offer.product_id) >= 0) {
      // Quantity Needs To Be Updated, Still Have Remaining Product In Inventory
      updated = await Company.updateOne({
        _id: company._id,
        productOffers: { $elemMatch: { id: data.offer.id } },
        inventory: { $elemMatch: { item_id: data.offer.product_id } },
      }, {
        $set: { 'productOffers.$': data.offer },
        $inc: { 'inventory.$.quantity': oldQuantity - data.offer.quantity },
      }).exec();
    } else if (oldQuantity > data.offer.quantity) {
      // Decreasing Quantity, No Remaining Product In Inventory
      updated = await Company.updateOne({
        _id: company._id,
        productOffers: { $elemMatch: { id: data.offer.id } },
      }, {
        $set: { 'productOffers.$': data.offer },
        $addToSet: { inventory: { item_id: data.offer.product_id, quantity: data.offer.quantity - oldQuantity } },
      }).exec();
    } else {
      // Increasing Quantity, But No Remaining Product In Inventory
      ret.status_code = 400;
      ret.payload.error = 'Insufficient Product In Inventory';
      throw new Error(ret.payload.error);
    }    

    if (updated) {
      ret.status_code = 200;
      ret.payload = { success: true, message: 'Product Offer Updated' };
    } else {
      throw new Error(ret.payload.error);
    }
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

const deposit_funds = async (data: IHandleFundsParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();
  const session = await Company.startSession();

  try {
    await session.withTransaction(async () => {
      // Validate Company
      let company: ICompany = await Company.findOne({ _id: data.company_id }).session(session);
      if (!company) {
        ret.status_code = 404;
        ret.payload.error = 'Company Not Found';
        throw new Error(ret.payload.error);
      }

      // Validate User
      let user: IUser = await User.findOne({ _id: data.user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      } else if (user._id !== company.ceo) {
        ret.status_code = 401;
        ret.payload.error = 'Unauthorized';
        throw new Error(ret.payload.error);
      }

      if (!data?.gold && !data?.funds) {
        ret.status_code = 400;
        ret.payload.error = 'No Funds To Transfer Provided';
        throw new Error(ret.payload.error);
      }

      if (data?.gold && user.gold < data?.gold) {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Gold';
        throw new Error(ret.payload.error);
      }

      let userCCIndex: number = -1;
      let compCCIndex: number = -1;
      if (data?.funds) {
        userCCIndex = user.wallet.findIndex(cc => cc.currency === data.funds.currency);
        compCCIndex = company.funds.findIndex(cc => cc.currency === data.funds.currency);
        if (userCCIndex === -1 || user.wallet[userCCIndex].amount < data.funds.amount) {
          ret.status_code = 400;
          ret.payload.error = 'Insufficient Currency';
          throw new Error(ret.payload.error);
        }
      }

      let userQuery: IMap = { _id: user._id };
      let userUpdates: IMap = { $inc: {} };

      if (data?.funds && userCCIndex >= 0) {
        userQuery['wallet'] = { $elemMatch: { currency: data.funds.currency } };
        userUpdates['$inc']['wallet.$.amount'] = -data.funds.amount;
      }

      if (data?.gold)
        userUpdates['$inc']['gold'] = data.gold;

      let updatedUser = await User.updateOne(userQuery, userUpdates).session(session);
      if (!updatedUser) {
        ret.status_code = 500;
        ret.payload.error = 'Failed To Remove Funds From User';
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let compQuery: IMap = { _id: company._id };
      let compUpdates: IMap = { $inc: {} };

      if (data?.funds && compCCIndex >= 0) {
        compQuery['funds'] = { $elemMatch: { currency: data.funds.currency } };
        compUpdates['$inc']['funds.$.amount'] = data.funds.amount;
      } else if (data?.funds && compCCIndex === -1) {
        compUpdates['$addToSet'] = { funds: data.funds };
      }

      if (data?.gold)
        compUpdates['$inc']['gold'] = data.gold;

      let updatedComp = await Company.updateOne(compQuery, compUpdates).session(session);
      if (updatedComp) {
        ret.status_code = 200;
        ret.payload = { success: true, message: 'Funds Deposited' };
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

const withdraw_funds = async (data: IHandleFundsParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();
  const session = await Company.startSession();

  try {
    await session.withTransaction(async () => {
      // Validate Company
      let company: ICompany = await Company.findOne({ _id: data.company_id }).session(session);
      if (!company) {
        ret.status_code = 404;
        ret.payload.error = 'Company Not Found';
        throw new Error(ret.payload.error);
      }

      // Validate User
      let user: IUser = await User.findOne({ _id: data.user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      } else if (user._id !== company.ceo) {
        ret.status_code = 401;
        ret.payload.error = 'Unauthorized';
        throw new Error(ret.payload.error);
      }

      if (!data?.gold && !data?.funds) {
        ret.status_code = 400;
        ret.payload.error = 'No Funds To Transfer Provided';
        throw new Error(ret.payload.error);
      }

      if (data?.gold && company.gold < data.gold) {
        ret.status_code = 400;
        ret.payload.error = 'Insufficient Gold';
        throw new Error(ret.payload.error);
      }

      let userCCIndex: number = -1;
      let compCCIndex: number = -1;    
      if (data?.funds) {
        compCCIndex = company.funds.findIndex(cc => cc.currency === data.funds.currency);
        userCCIndex = user.wallet.findIndex(cc => cc.currency === data.funds.currency); 
        if (compCCIndex === -1 || company.funds[compCCIndex].amount < data.funds.amount) {
          ret.status_code = 400;
          ret.payload.error = 'Insufficient Currency';
          throw new Error(ret.payload.error);
        }
      }

      let compQuery: IMap = { _id: company._id };
      let compUpdates: IMap = { $inc: {} };

      if (data?.funds && compCCIndex >= 0) {
        compQuery['funds'] = { $elemMatch: { currency: data.funds.currency } };
        compUpdates['$inc']['funds.$.amount'] = -data.funds.amount;
      }

      if (data?.gold)
        compUpdates['$inc']['gold'] = -data.gold;

      let updatedComp = await Company.updateOne(compQuery, compUpdates).session(session);
      if (!updatedComp) {
        ret.status_code = 500;
        ret.payload.error = 'Failed To Remove Funds From User';
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let userQuery: IMap = { _id: user._id };
      let userUpdates: IMap = { $inc: {} };

      if (data?.funds && userCCIndex >= 0) {
        userQuery['wallet'] = { $elemMatch: { currency: data.funds.currency } };
        userUpdates['$inc']['wallet.$.amount'] = data.funds.amount;
      } else if (data?.funds && userCCIndex === -1) {
        userUpdates['$addToSet'] = { funds: data.funds };
      }

      if (data?.gold)
        userUpdates['$inc']['gold'] = data.gold;

      let updatedUser = await User.updateOne(userQuery, userUpdates).session(session);
      if (updatedUser) {
        ret.status_code = 200;
        ret.payload = { success: true, message: 'Funds Deposited' };
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

const edit_employee = async (data: IEditEmployeeParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();

  try {
    // Validate User
    const user: IUser = await User.findOne({ _id: data.user_id }).exec();
    if (!user) {
      ret.status_code = 404;
      ret.payload.error = 'User Not Found';
      throw new Error(ret.payload.error);
    }

    // Validate Company and Permissions
    const company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
    if (!company) {
      ret.status_code = 404;
      ret.payload.error = 'Company Not Found';
      throw new Error(ret.payload.error);
    } else if (company.ceo !== user._id) {
      ret.status_code = 401;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }

    let employeeIndex = company.employees.findIndex(emp => emp.user_id === data.employee.user_id);
    if (employeeIndex === -1) {
      ret.status_code = 400;
      ret.payload.error = 'User Is Not An Employee';
      throw new Error(ret.payload.error);
    }

    let compQuery = {
      _id: company._id,
      employees: { $elemMatch: { user_id: data.employee.user_id } },
    };

    let compUpdates = {
      $set: {
        'employees.$.title': data.employee?.title,
        'employees.$.wage': data.employee?.wage,
      },
    };

    let updatedComp = await Company.updateOne(compQuery, compUpdates).exec();
    if (updatedComp) {
      ret.status_code = 200;
      ret.payload = { success: true, message: 'Employee Updated' };
    } else {
      throw new Error(ret.payload.error);
    }
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

const fire_employee = async (data: IFireEmployeeParams): Promise<ICompanyActionResult> => {
  let ret: ICompanyActionResult = defaultActionRes();
  const session = await Company.startSession();

  try {
    await session.withTransaction(async () => {
      const user: IUser = await User.findOne({ _id: data.user_id }).session(session);
      if (!user) {
        ret.status_code = 404;
        ret.payload.error = 'User Not Found';
        throw new Error(ret.payload.error);
      }

      const company: ICompany = await Company.findOne({ _id: data.company_id }).session(session);
      if (!company) {
        ret.status_code = 404;
        ret.payload.error = 'Company Not Found';
        throw new Error(ret.payload.error);
      } else if (company.ceo !== user._id) {
        ret.status_code = 401;
        ret.payload.error = 'Unauthorized';
        throw new Error(ret.payload.error);
      }

      let employeeIndex = company.employees.findIndex(emp => emp.user_id === data.employee_id);
      if (employeeIndex === -1) {
        ret.status_code = 400;
        ret.payload.error = 'User Is Not An Employee';
        throw new Error(ret.payload.error);
      }

      let updatedComp = await company.updateOne({ $pull: { employees: { user_id: data.employee_id } } }).session(session);
      if (!updatedComp) {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }

      let updatedUser = await User.updateOne({ _id: data.employee_id }, { $set: { job: 0 } }).session(session);
      if (updatedUser) {
        ret.status_code = 200;
        ret.payload = { success: true, message: 'Employee Fired' };
      } else {
        await session.abortTransaction();
        throw new Error(ret.payload.error);
      }
    });
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
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

  let updatedComp = await company.updateOne({ $set: { name: data.name } }).exec();
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
  
  let compUpdates = { $set: { location: data.region_id }, $inc: { gold: -travel_info.cost } };
  let updatedComp = await company.updateOne(compUpdates).exec();
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