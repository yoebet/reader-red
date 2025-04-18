import {Model} from './model';
import {Book} from './book';

export class UserBook extends Model {

  bookId: string;
  role: string;
  textSearch?: boolean;

  book: Book;
}
