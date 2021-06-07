import Newspaper, { IArticle, INewspaper } from "@/models/Newspaper";
import { NewspaperActions } from "@/util/actions";
import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";

interface IPublishArticleParams {
  user_id?: number,
  news_id: number,
  article: {
    id?: string,
    title: string,
    content: string,
    country: number,
    published: boolean,
    publishDate: Date,
  },
}

interface ISaveArticleParams {
  user_id?: number,
  news_id: number,
  article: {
    title: string,
    content: string,
    published: boolean,
  },
}

interface INewspaperActionResult {
  status_code: number,
  payload: {
    success: boolean,
    error?: string,
    message?: string,
    [key: string]: any,
  },
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'POST': {
      let { user_id } = validation_res;
      let { action, data } = req.body;
      if (data)
        data.user_id = user_id;

      switch (action) {
        case NewspaperActions.PUBLISH_ARTICLE: {
          let result: INewspaperActionResult = await publish_article(data as IPublishArticleParams);
          return res.status(result.status_code).json(result.payload);
        }
        case NewspaperActions.SAVE_ARTICLE: {
          let result: INewspaperActionResult = await save_article(data as ISaveArticleParams);
          return res.status(result.status_code).json(result.payload);
        }
        default:
          return res.status(400).json({ error: 'Unsupported Action' });
      }
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}

async function publish_article(data: IPublishArticleParams): Promise<INewspaperActionResult> {
  let newspaper: INewspaper = await Newspaper.findOne({ _id: data.news_id }).exec();
  if (!newspaper)
    return { status_code: 404, payload: { success: false, error: 'Newspaper Not Found' } };
  else if (newspaper.author !== data.user_id)
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };

  let article_id: string = '';
  let updates: { articles: IArticle[] };
  if (!data.article.id) {
    try {
      const { randomBytes } = await import('crypto');
      randomBytes(10, (err, buf) => {
        if (err) throw err;
        article_id = buf.toString('hex');
      });
    } catch (e) {
      return { status_code: 500, payload: { success: false, error: 'Failed to Generate Article ID' } };
    }

    updates = {
      articles: [...newspaper.articles, {
        id: article_id,
        title: data.article.title,
        text: data.article.content,
        published: true,
        publishDate: data.article.publishDate,
        likes: [] as number[],
      }],
    };
  } else {
    let index: number = newspaper.articles.findIndex(article => article.id === data.article.id);
    if (index > -1) {
      newspaper.articles.splice(index, 1, {
        id: data.article.id,
        title: data.article.title,
        text: data.article.content,
        published: true,
        publishDate: data.article.publishDate,
        likes: [] as number[],
      });
    } else {
      return { status_code: 200, payload: { success: false, error: 'Article Not Found' } };
    }
  }

  let updated = await newspaper.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Article Published', article: article_id } };
  
  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function save_article(data: ISaveArticleParams): Promise<INewspaperActionResult> {
  let newspaper: INewspaper = await Newspaper.findOne({ _id: data.news_id }).exec();
  if (!newspaper)
    return { status_code: 404, payload: { success: false, error: 'Newspaper Not Found' } };
  else if (newspaper.author !== data.user_id)
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}