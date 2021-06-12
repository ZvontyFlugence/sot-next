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

interface INewspaperActionResult {
  status_code: number,
  payload: {
    success: boolean,
    error?: string,
    message?: string,
    [key: string]: any,
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
      let { user_id } = validation_res;
      let { action, data } = JSON.parse(req.body) as IRequestBody;
      if (data)
        data.user_id = user_id;

      switch (action) {
        case NewspaperActions.EDIT_ARTIClE: {
          let result: INewspaperActionResult = await edit_article(data as IEditArticleParams);
          return res.status(result.status_code).json(result.payload);
        }
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

  try {
    const { randomBytes } = await import('crypto');
    const buf = randomBytes(10);
    data.article.id = buf.toString('hex');
  } catch (e) {
    return { status_code: 500, payload: { success: false, error: 'Failed to Generate Article ID' } };
  }

  let updates = {
    articles: [...newspaper.articles, {
      id: data.article.id,
      title: data.article.title,
      text: data.article.content,
      published: true,
      publishDate: new Date(Date.now()),
      likes: [] as number[],
    }],
  };

  let updated = await newspaper.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Article Published', article: data.article.id } };
  
  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function save_article(data: ISaveArticleParams): Promise<INewspaperActionResult> {
  let newspaper: INewspaper = await Newspaper.findOne({ _id: data.news_id }).exec();
  if (!newspaper)
    return { status_code: 404, payload: { success: false, error: 'Newspaper Not Found' } };
  else if (newspaper.author !== data.user_id)
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };

    try {
      const { randomBytes } = await import('crypto');
      const buf = randomBytes(10);
      data.article.id = buf.toString('hex');
    } catch (e) {
      return { status_code: 500, payload: { success: false, error: 'Failed to Generate Article ID' } };
    }

  let updates = {
    articles: [...newspaper.articles, {
      id: data.article.id,
      title: data.article.title,
      text: data.article.content,
      published: false,
      publishDate: null,
      likes: [] as number[],
    } as IArticle],
  };

  let updated = newspaper.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Article Saved as Draft' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}

async function edit_article(data: IEditArticleParams): Promise<INewspaperActionResult> {
  let newspaper: INewspaper = await Newspaper.findOne({ _id: data.news_id }).exec();
  if (!newspaper)
    return { status_code: 404, payload: { success: false, error: 'Newspaper Not Found' } };
  else if (newspaper.author !== data.user_id)
    return { status_code: 401, payload: { success: false, error: 'Unauthorized' } };

  let articleIndex = newspaper.articles.findIndex(a => a.id === data.article.id);
  if (articleIndex === -1)
    return { status_code: 404, payload: { success: false, error: 'Article Not Found' } };

  let article = newspaper.articles[articleIndex];
  newspaper.articles[articleIndex] = {
    ...article,
    title: data.article.title,
    text: data.article.content,
    published: data.article.published,
  } as IArticle;

  if (data.article.published)
    newspaper.articles[articleIndex].publishDate = new Date(data.article.publishDate);

  let updates = { articles: [...newspaper.articles] };
  let updated = await newspaper.updateOne({ $set: updates }).exec();
  if (updated)
    return { status_code: 200, payload: { success: true, message: 'Article Edited' } };

  return { status_code: 500, payload: { success: false, error: 'Something Went Wrong' } };
}