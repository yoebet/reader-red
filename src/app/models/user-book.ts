import {Model} from './model';

export class UserBook extends Model {
  // userId: string;
  bookId: string;
  role: string;
  isAllChaps: boolean;
  chaps: any[];
  chapsCount: number;
}
