import Country, { ICountry } from "@/models/Country";
import Party, { IParty } from "@/models/Party";
import User, { IUser } from "@/models/User";
import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      let partyId: number;
      let withLeadership: boolean = false;
      let withCountry: boolean = false;

      try {
        if (req.query.leaders) {
          withLeadership = (req.query.leaders as string).toLowerCase().trim() === 'true';
        }

        if (req.query.country) {
          withCountry = (req.query.country as string).toLowerCase().trim() === 'true';
        }
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid Query Parameter(s) Value' });
      }

      try {
        if (req.query.partyId) {
          partyId = Number.parseInt(req.query.partyId as string);
        } else {
          throw new Error('Missing Party ID');
        }
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid Party ID' });
      }

      let result: IGetPartyResponse = await getParty({ id: partyId, withLeadership, withCountry });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

interface IGetPartyRequest {
  withLeadership: boolean,
  withCountry: boolean,
  id: number,
}

interface IGetPartyResponse {
  status_code: number,
  payload: {
    party?: IParty,
    leadershipInfo?: ILeadershipInfo,
    countryInfo?: ICountryInfo,
    error?: string,
  },
}

export interface ILeadershipInfo {
  president?: {
    name: string,
    image: string,
  },
  vp?: {
    name: string,
    image: string,
  },
}

export interface ICountryInfo {
  name: string,
  flag: string,
}

export async function getParty(data: IGetPartyRequest): Promise<IGetPartyResponse> {
  let party: IParty = await Party.findOne({ _id: data.id }).exec();
  if (!party)
    return { status_code: 404, payload: { error: 'Party Not Found' } };

  let leadershipInfo: ILeadershipInfo = {};
  let countryInfo: ICountryInfo | {} = {};

  if (data.withLeadership) {
    if (party.president !== -1) {
      let president: IUser = await User.findOne({ _id: party.president }).exec();

      if (president) {
        leadershipInfo.president = {
          name: president.username,
          image: president.image,
        };

        // Can only have a VP with a valid Party President
        if (party.vp !== -1) {
          let vp: IUser = await User.findOne({ _id: party.vp }).exec();

          if (vp) {
            leadershipInfo.vp = {
              name: vp.username,
              image: vp.image,
            };
          }
        }
      }
    }
  }

  if (data.withCountry) {
    let country: ICountry = await Country.findOne({ _id: party.country }).exec();
    if (!country) {
      return { status_code: 404, payload: { error: 'Country Not Found' } };
    } else {
      countryInfo = {
        name: country.name,
        flag: country.flag_code,
      };
    }
  }

  return {
    status_code: 200,
    payload: {
      party,
      leadershipInfo: leadershipInfo === {} ? undefined : leadershipInfo,
      countryInfo: countryInfo === {} ? undefined : countryInfo as ICountryInfo,
    },
  };
}