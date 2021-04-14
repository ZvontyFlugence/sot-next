import { UserActions } from '@/util/actions';

/* Interfaces */

export interface ILocationInfo {
  region_name: string,
  owner_id: number,
  owner_name: string,
  owner_flag: string,
}

export interface ICEOInfo {
  ceo_id: number,
  ceo_name: string,
  ceo_image: string,
}

/* Functions */

export function jsonify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

export function buildLevelUpAlert(level: number) {
  return {
    read: false,
    type: UserAction.LEVEL_UP,
    message: `Congrats! You have leveled up to level ${level} and received 5 gold`,
    timestamp: new Date(Date.now()),
  };
}