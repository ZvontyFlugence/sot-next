import Country, { ICountry, ICountryStats } from "@/models/Country";
import User, { IUser } from "@/models/User";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

const CountryStats = {
  POPULATION: 'population',
}

interface IResult {
  status_code: number,
  payload: {
    countries?: ICountryStats[],
    error?: string,
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      const { stat, sort, limit } = req.query;
      let result: IResult; 
      try {
      result = await get(typeof stat === 'string' && stat, typeof sort === 'string' && sort, typeof limit === 'string' && Number.parseInt(limit));
      } catch (e) {
        result = { status_code: 400, payload: { error: 'Something Went Wrong!' } };
      }
      return res.status(result.status_code).json(result.payload);
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function get(stat?: string, sort?: string, limit?: number) {
  // Ensure db connection established
  await connectToDB();
  
  switch (stat) {
    case CountryStats.POPULATION: {
      let countries: ICountry[] = await Country.find({}).exec();

      let countryStats: ICountryStats[] = await Promise.all(countries.map(async c => {
        let citizens = await User.find({ country: c._id }).exec();
        return { _id: c._id, name: c.name, flag_code: c.flag_code, population: citizens.length };
      }));

      if (sort === 'desc') {
        countryStats.sort((a, b) => a[stat] - b[stat]);
      } else {
        countryStats.sort((a, b) => b[stat] - a[stat]);
      }
    
      if (limit) {
        countryStats = countryStats.slice(0, limit);
      }
    
      return { status_code: 200, payload: { countries: countryStats } };
    }
    default:
      return { status_code: 400, payload: { error: 'Unhandled Country Statistic!' } };
  }
}