import { IUser } from '@/models/User';
import jwt from 'jsonwebtoken';
import { parseCookies, destroyCookie } from 'nookies';
import { NextApiRequest, NextApiResponse } from "next";
import { IncomingMessage } from 'http';

interface IDecodedToken {
  user_id?: number;
}

interface IMeResponse extends Response {
  user?: IUser;
}

export async function validateToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    let authHeader = req.headers.authorization;
    let token = authHeader.replace('Bearer ', '');

    let decoded: IDecodedToken | string = await jwt.verify(token, process.env.JWT_SECRET);
    if ((decoded as IDecodedToken).user_id) {
      return { user_id: (decoded as IDecodedToken).user_id };
    }
  } catch (e) {
    destroyCookie({ res }, 'token');
    return { error: 'Invalid or Missing Token' };
  }
}

export async function getCurrentUser(req: IncomingMessage) {
  let user: IUser;
  const cookies = parseCookies({ req });
  if (cookies.token) {
    let res: IMeResponse = await fetch(`${process.env.URI}/api/me`, {
      headers: {
        'Accepts': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cookies.token}`
      }
    });

    res = await res.json();
    user = res?.user;
  }

  return { user: user || null, isAuthenticated: !!user };
}