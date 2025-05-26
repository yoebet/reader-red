import { Model } from './model';

export class VipCode extends Model {
  // ownerId: string;
  // ownerName: string;
  code: string;
  term: 'M'|'Y'|'P'; // month/year/permanent
  termNum?: number;
  orderId?: string;
  redeemed: boolean;
  vipTermId?: string;
  redeemerId?: string;
  redeemerName?: string;
  redeemedAt?: Date;
}

export class VipTerm extends Model {
  // userId: string;
  // userName: string;
  orderId?: string;
  redeemCode?: string;
  term: 'Y'|'M'|'P';
  termNum?: number;
  startTime?: Date;
  endTime?: Date;
  status: 'N'|'C'|'E'; // not-used/current/expired
}
