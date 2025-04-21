import {Model} from './model';
import {Book} from './book';
import {Para} from './para';
import { WordStat } from './word-stat';

export class Chap extends Model {
  name: string;
  zhName = '';
  bookId: string;
  no: number;

  status: string;

  // isFree: boolean;
  // price: number; // cents
  // priceLabel: string;

  contentPack: ChapContentPack;

  paras: Para[];

  book: Book;

  isMyChap = false;

  paraCommentsCountLoaded = false;

  stat?: WordStat;
}

export class ChapContentPack {
  bookId: string;
  // file: string;
  srcFile: string;
  // hash: string;
  // size: number;
  // builtAt: Date;
}
