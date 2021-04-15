import { NextRouter } from "next/router";

export function neededXP(level: number) {
  return Math.round(0.08 * (level**3) + 0.8 * (level ** 2) + 2 * level);
}

export function refreshData(router: NextRouter) {
  router.replace(router.asPath);
}

export interface IRequest {
  url: string,
  method: 'GET' | 'POST',
  payload?: any,
  token?: string,
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
    try {
      let promise = res.json();
      return promise;
    } catch (e) {
      return new Error('Request Failed to Parse');
    }
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