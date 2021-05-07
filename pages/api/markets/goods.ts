import Company, { ICompany } from '@/models/Company';
import Country, { ICountry } from '@/models/Country';
import Region, { IRegion } from '@/models/Region';
import { IGoodsMarketOffer } from '@/util/apiHelpers';
import { validateToken } from '@/util/auth';
import { NextApiRequest, NextApiResponse } from 'next';

interface IResponse {
  status_code: number,
  payload: {
    error?: string,
    productOffers?: IGoodsMarketOffer[],
    cc?: string,
  },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res?.error) {
    return res.status(401).json({ error: validation_res.error });
  }

  switch (req.method) {
    case 'GET': {
      let country_id: number;
      try {
        country_id = parseInt(req.query.country_id as string);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid Country' });
      }

      let result: IResponse = await getCountryProductOffers(country_id);
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function getCountryProductOffers(country_id: number): Promise<IResponse> {
  let country: ICountry = await Country.findOne({ _id: country_id }).exec();
  if (!country)
    return { status_code: 404, payload: { error: 'Country Not Found' } };

  let regions: IRegion[] = await Region.find({})
    .where({ owner: country_id })
    .exec();

  if (!regions || regions.length === 0)
    return { status_code: 200, payload: { productOffers: [] } };

  let companies: ICompany[] = await Company.find({})
    .where({ location: { $in: regions.map(region => region._id) } })
    .exec();

  companies.filter(comp => comp.productOffers.length > 0);
  let goodsMarketOffers: IGoodsMarketOffer[] = companies.reduce((accum: IGoodsMarketOffer[], company: ICompany) => {
    let productOffers: IGoodsMarketOffer[] = company.productOffers.map(offer => ({
      ...offer,
      company: {
        id: company._id,
        image: company.image,
        name: company.name,
        type: company.type,
        ceo: company.ceo,
      },
    }));

    return [...accum, ...productOffers];
  }, []);

  return { status_code: 200, payload: { productOffers: goodsMarketOffers, cc: country.currency } };
}