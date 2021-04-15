import Company, { ICompany, IJobOffer, IProductOffer } from '@/models/Company';
import { CompanyActions } from '@/util/actions';
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
  data: ICreateJobParams | ICreateProductParams | IDeleteJobParams | IDeleteProductParams |
    IEditJobParams | IEditProductParams
}

interface IBaseParams {
  user_id?: number,
  company_id: number,
}

interface ICreateJobParams extends IBaseParams {
  offer: IJobOffer,
}

interface ICreateProductParams extends IBaseParams {
  offer: IProductOffer,
}

interface IDeleteJobParams extends IBaseParams {
  job_id: string,
}

interface IDeleteProductParams extends IBaseParams {
  product_id: string,
}

interface IEditJobParams extends IBaseParams {
  offer: IJobOffer
}

interface IEditProductParams extends IBaseParams {
  offer: IProductOffer,
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
          result = await create_product(data as ICreateProductParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.DELETE_JOB: {
          result = await delete_job(data as IDeleteJobParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.DELETE_PRODUCT: {
          result = await delete_product(data as IDeleteProductParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.EDIT_JOB: {
          result = await edit_job(data as IEditJobParams);
          return res.status(result.status_code).json(result.payload);
        }
        case CompanyActions.EDIT_PRODUCT: {
          result = await edit_product(data as IEditProductParams);
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

const create_product = async (data: ICreateProductParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();

  if (!company || company.ceo !== data.user_id)
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };

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

  let updates = { productOffers: [...company.productOffers, data.offer] };

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

const delete_product = async (data: IDeleteProductParams): Promise<ICompanyActionResult> => {
  let company: ICompany = await Company.findOne({ _id: data.company_id }).exec();
  if (!company || company.ceo !== data.user_id)
    return { status_code: 400, payload: { success: false, error: 'Invalid Company' } };

  let productIndex = company.productOffers.findIndex(offer => offer.id !== data.product_id);
  if (productIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Product Offer Not Found' } };

  company.productOffers.splice(productIndex, 1);
  let updates = { productOffers: [...company.productOffers] };
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

const edit_product = async (data: IEditProductParams): Promise<ICompanyActionResult> => {
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
