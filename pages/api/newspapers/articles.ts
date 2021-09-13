import Newspaper, { IArticle, INewspaper } from "@/models/Newspaper";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'GET': {
      // Ensure DB Connection
      await connectToDB();

      let newspapers: INewspaper[] = await Newspaper.find({}).exec();
      let articles: IArticle[] = [];

      for (let newspaper of newspapers) {
        let published = newspaper.articles.filter(a => a.published === true);
        articles.push(...published.map(a => ({ ...a, newspaper: newspaper._id})));
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