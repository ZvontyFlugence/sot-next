import { NextRouter } from "next/router";

export function neededXP(level: number) {
  return Math.round(0.08 * (level**3) + 0.8 * (level ** 2) + 2 * level);
}

export function refreshData(router: NextRouter) {
  router.replace(router.asPath);
}