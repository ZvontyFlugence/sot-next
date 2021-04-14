import Company, { ICompany, IJobOffer } from '@/models/Company';
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

interface ICreateJobParams {
  user_id: number,
  company_id: number,
  offer: IJobOffer,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(401).json({ error: validation_res.error });
  }

  switch (req.method) {
    case 'POST': {
      const { user_id } = validation_res;
      const { action, data } = JSON.parse(req.body);
      let result: ICompanyActionResult;

      // Ensure DB Conn
      await connectToDB();

      switch (action) {
        case CompanyActions.CREATE_JOB: {
          result = await create_job({ user_id, ...data });
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
    randomBytes(10, (err, buf) => {
      if (err) throw err;
      data.offer.id = buf.toString('hex');
    });
  } catch (e) {
    return { status_code: 500, payload: { success: false, error: 'Failed to generate offer id' } };
  }

  let updates = { jobOffers: [...company.jobOffers, data.offer] };

  let updated = await company.updateOne({ $set: { ...updates }});
  if (updated) {
    return { status_code: 200, payload: { success: true } };
  }

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}