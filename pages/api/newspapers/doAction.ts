import Newspaper, { IArticle, INewspaper } from "@/models/Newspaper";
import { NewspaperActions } from "@/util/actions";
import { ActionResult, defaultActionResult } from "@/util/apiHelpers";
import { validateToken } from "@/util/auth";
import { connectToDB } from "@/util/mongo";
import { NextApiRequest, NextApiResponse } from "next";
import { IMap } from "../companies/doAction";

interface IPublishArticleParams {
  user_id?: number,
  news_id: number,
  article: {
    id?: string,
    title: string,
    content: string,
  },
}

interface ISaveArticleParams {
  user_id?: number,
  news_id: number,
  article: {
    id?: string,
    title: string,
    content: string,
  },
}

interface IEditArticleParams {
  user_id?: number,
  news_id: number,
  article: {
    id: string,
    title: string,
    content: string,
    published: boolean,
    publishDate?: Date,
  },
}

interface IRequestBody {
  action: string,
  data?: IPublishArticleParams | ISaveArticleParams | IEditArticleParams
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  let validation_res = await validateToken(req, res);
  if (validation_res?.error)
    return res.status(401).json({ error: validation_res.error });

  switch (req.method) {
    case 'POST': {
      // Ensure DB Connection
      await connectToDB();

      let { user_id } = validation_res;
      let { action, data } = JSON.parse(req.body) as IRequestBody;
      if (data)
        data.user_id = user_id;

      switch (action) {
        case NewspaperActions.EDIT_ARTIClE: {
          let result: ActionResult = await edit_article(data as IEditArticleParams);
          return res.status(result.status_code).json(result.payload);
        }
        case NewspaperActions.PUBLISH_ARTICLE: {
          let result: ActionResult = await publish_article(data as IPublishArticleParams);
          return res.status(result.status_code).json(result.payload);
        }
        case NewspaperActions.SAVE_ARTICLE: {
          let result: ActionResult = await save_article(data as ISaveArticleParams);
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

async function publish_article(data: IPublishArticleParams): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let news: INewspaper = await Newspaper.findOne({ _id: data.news_id }).exec();
    if (!news) {
      ret.status_code = 404;
      ret.payload.error = 'Newspaper Not Found';
      throw new Error(ret.payload.error);
    } else if (news.author !== data.user_id) {
      ret.status_code = 401;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }

    const { randomBytes } = await import('crypto');
    const buf = await randomBytes(10);
    data.article.id = buf.toString('hex');

    let new_article: IArticle = {
      id: data.article.id,
      title: data.article.title,
      text: data.article.content,
      published: true,
      publishDate: new Date(Date.now()),
      likes: [] as number[],
    };

    let updates: IMap = { $addToSet: { articles: new_article } };
    let updated = await news.updateOne(updates);
    if (!updated)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Article Published', article: data.article.id };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function save_article(data: ISaveArticleParams): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let news: INewspaper = await Newspaper.findOne({ _id: data.news_id }).exec();
    if (!news) {
      ret.status_code = 404;
      ret.payload.error = 'Newspaper Not Found';
      throw new Error(ret.payload.error);
    } else if (news.author !== data.user_id) {
      ret.status_code = 401;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }

    const { randomBytes } = await import('crypto');
    const buf = await randomBytes(10);
    data.article.id = buf.toString('hex');

    let new_article: IArticle = {
      id: data.article.id,
      title: data.article.title,
      text: data.article.content,
      published: false,
      publishDate: null,
      likes: [] as number[],
    };

    let updates: IMap = { $addToSet: { articles: new_article } };
    let updated = await news.updateOne(updates);
    if (!updated)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Article Saved As Draft' };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}

async function edit_article(data: IEditArticleParams): Promise<ActionResult> {
  let ret: ActionResult = defaultActionResult();

  try {
    let news: INewspaper = await Newspaper.findOne({ _id: data.news_id }).exec();
    if (!news) {
      ret.status_code = 404;
      ret.payload.error = 'Newspaper Not Found';
      throw new Error(ret.payload.error);
    } else if (news.author !== data.user_id) {
      ret.status_code = 401;
      ret.payload.error = 'Unauthorized';
      throw new Error(ret.payload.error);
    }

    let article: IArticle = news.articles.find(a => a.id === data.article.id);
    if (!article) {
      ret.status_code = 404;
      ret.payload.error = 'Article Not Found';
      throw new Error(ret.payload.error);
    }

    article = {
      ...article,
      title: data.article.title,
      text: data.article.content,
      published: data.article.published,
    };

    if (article.published)
      article.publishDate = new Date(data.article.publishDate);

    let updates: IMap = { $pull: { articles: { id: data.article.id } }, $addToSet: { articles: article } };
    let updated = await news.updateOne(updates);
    if (!updated)
      throw new Error(ret.payload.error);

    ret.status_code = 200;
    ret.payload = { success: true, message: 'Article Edited', article: data.article.id };
  } catch (e: any) {
    // Temp logging
    console.error(e);
  } finally {
    return ret;
  }
}