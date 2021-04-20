import { IEmployee, IJobOffer } from '@/models/Company';
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

export interface IItem {
  item_id: number,
  quantity: number,
}

export interface IJobMarketOffer extends IJobOffer {
  company: {
    id: number,
    image: string,
    name: string,
    type: number,
    ceo: number,
  }
}

export interface IEmployeeInfo extends IEmployee {
  name: string,
  image: string,
}

/* Functions */

export function jsonify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

export function buildLevelUpAlert(level: number) {
  return {
    read: false,
    type: UserActions.LEVEL_UP,
    message: `Congrats! You have leveled up to level ${level} and received 5 gold`,
    timestamp: new Date(Date.now()),
  };
}