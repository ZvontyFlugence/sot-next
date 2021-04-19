import Company, { ICompany, IJobOffer } from "@/models/Company";
import Country, { ICountry } from "@/models/Country";
import Region, { IRegion } from "@/models/Region";
import { IJobMarketOffer } from "@/util/apiHelpers";
import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";

interface IResponse {
  status_code: number,
  payload: {
    error?: string,
    jobOffers?: IJobMarketOffer[],
    cc?: string,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res.error) {
    return res.status(401).json({ erorr: validation_res.error });
  }

  switch (req.method) {
    case 'GET': {
      let country_id: number;
      
      try {
        country_id = parseInt(req.query.country_id as string);
      } catch (e) {
        return { status_code: 400, payload: { error: 'Invalid Country' } };
      }

      let result: IResponse = await getCountryJobOffers(country_id);
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function getCountryJobOffers(country_id: number): Promise<IResponse> {
  let country: ICountry = await Country.findOne({ _id: country_id }).exec();

      if (!country) {
        return { status_code: 404, payload: { error: 'Country Not Found' } };
      }

      let regions: IRegion[] = await Region.find({})
        .where({ owner: country_id })
        .exec();

      if (!regions || regions.length === 0) {
        return { status_code: 200, payload: { jobOffers: [] } };
      }

      let companies: ICompany[] = await Company.find({})
        .where({ location: { $in: regions.map(region => region._id) } })
        .exec();

      companies.filter(company => company.jobOffers.length > 0);
      let jobMarketOffers: IJobMarketOffer[] = companies.reduce((accum: IJobMarketOffer[], company: ICompany) => {
        let jobOffers: IJobMarketOffer[] = company.jobOffers.map(offer => ({
          ...offer,
          company: {
            id: company._id,
            image: company.image,
            name: company.name,
            type: company.type,
            ceo: company.ceo,
          },
        }));

        return [...accum, ...jobOffers];
      }, []);

      return { status_code: 200, payload: { jobOffers: jobMarketOffers, cc: country.currency } };
}