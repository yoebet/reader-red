import {Model} from './model';
import {Book} from './book';
import {Para} from './para';

export class Chap extends Model {
  name: string;
  zhName = '';
  bookId: string;
  no: number;
  paras: Para[];

  book: Book;

  isMyChap = false;
}
