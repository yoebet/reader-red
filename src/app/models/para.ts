import {Model} from './model';
import {Book} from './book';
import {Chap} from './chap';

export class Para extends Model {
  content = '';
  trans = '';
  chapId: string;
  bookId: string;

  book: Book;
  chap: Chap;
}
