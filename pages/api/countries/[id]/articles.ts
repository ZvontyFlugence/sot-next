import Newspaper, { INewspaper } from "@/models/Newspaper";
import User, { IUser } from "@/models/User";
import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      let countryId: number;
      try {
        countryId = Number.parseInt(req.query?.id as string);
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid Country ID' });
      }

      let citizens: IUser[] = await User.find({}).where({ country: countryId }).exec();
      let articles: any[] = [];
      for (let citizen of citizens) {
        if (citizen.newspaper > 0) {
          let newspaper: INewspaper = await Newspaper.findOne({ _id: citizen.newspaper }).exec();
          let published = newspaper.articles.filter(a => a.published === true);
          articles.push(...published.map(a => ({ ...a, newspaper: newspaper._id})));
        }
      }

      articles.sort((articleA, articleB) => articleB.likes.length - articleA.likes.length);
      if (articles.length > 5) {
        articles = articles.slice(0, 5);
      }

      return res.status(200).json({ articles: articles ?? [] });
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}