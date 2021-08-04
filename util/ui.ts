import { NextRouter } from "next/router";

export function neededXP(level: number) {
  return Math.round(0.08 * (level**3) + 0.8 * (level ** 2) + 2 * level);
}

export function refreshData(router: NextRouter) {
  router.replace(router.asPath);
}

export interface IGameItem {
  id: number;
  name: string;
  quality: number;
  image: string;
}

export interface IRequest {
  url: string,
  method: 'GET' | 'POST',
  payload?: any,
  token?: string,
}

export interface IRankingTypeMap {
  [type: string]: IRankingType;
}

export interface IRankingType {
  label: React.ReactNode;
  route: string;
}

interface IRequestOpts {
  method: string,
  headers?: {
    authorization: string,
  },
  body?: string
}

export function request(params: IRequest): Promise<any> {
  let opts: IRequestOpts = { method: params.method };
  
  if (params.token) {
    opts.headers = {
      authorization: `Bearer ${params.token}`,
    };
  }

  if (params.payload) {
    opts.body = JSON.stringify(params.payload);
  }

  return fetch(params.url, opts).then(res => {
    let result: Promise<any> | Error
    try {
      result = res.json();
    } catch (e) {
      result = new Error('Request Failed to Parse');
    }

    return Promise.resolve(result);
  });
}

export function showToast(toastFn: any, status: string, title: string, description?: string) {
  toastFn({
    position: 'top-right',
    title,
    description: description,
    status,
    duration: 2500,
    isClosable: true,
  });
}

export const pSBC = (p: any, c0: any, c1?: any, l?: any) => {
  let r: any, g: any, b: any, P: any, f: any, t: any, h: any, i = parseInt, m = Math.round, a: any = typeof(c1) == "string";
  if (typeof(p) != "number" || p <- 1 || p > 1 ||
      typeof(c0) != "string" || (c0[0] !== 'r' && c0[0] !== '#') || (c1 && !a))
    return null;
  let pSBCr = undefined;
  
  if (!pSBCr) {
    pSBCr = (d) => {
      let n = d.length;
      let x: { r?: any, g?: any, b?: any, a?: any } = {};
      if (n > 9) {
          [r, g, b, a] = d = d.split(",");
          n = d.length;
          if (n < 3 || n > 4)
            return null;
          x.r = i(r[3] === "a" ? r.slice(5) : r.slice(4));
          x.g = i(g);
          x.b = i(b);
          x.a = a ? parseFloat(a) : -1;
      } else {
          if (n === 8 || n === 6 || n < 4)
            return null;
          if (n < 6)
            d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
          d = i(d.slice(1), 16);
          if (n === 9 || n === 5) {
            x.r = (d >> 24) & 255;
            x.g = (d >> 16) & 255;
            x.b = (d >> 8) & 255;
            x.a = m((d & 255) / 0.255) / 1000;
          } else {
            x.r = d >> 16;
            x.g = (d >> 8) & 255;
            x.b = d & 255;
            x.a = -1;
          }
      }
      return x;
    };
  }

  h = c0.length > 9;
  h = a ? c1.length > 9 ? true : c1 === "c" ? !h : false : h;
  f = pSBCr(c0);
  P = p < 0;
  t = c1 && c1 !== "c" ? pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 };
  p = P ? p * -1 : p;
  P = 1-p;
  if (!f || !t)
    return null;
  if (l) {
    r = m(P * f.r + p * t.r);
    g = m(P * f.g + p * t.g);
    b = m(P * f.b + p * t.b);
  } else {
    r = m((P * f.r**2 + p * t.r**2)**0.5);
    g = m((P * f.g**2 + p * t.g**2)**0.5);
    b = m((P * f.b**2 + p * t.b**2)**0.5);
  }
  a = f.a;
  t = t.a;
  f = a >= 0 || t >= 0;
  a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
  if (h)
    return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a*1000) / 1000 : "") + ")";
  else
    return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2);
}