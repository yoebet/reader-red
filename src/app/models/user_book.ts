import {Model} from './model';
import {Book} from './book';

export class UserBook extends Model {

  static roles = ['', 'Admin', 'Editor'];

  userId: string;
  bookId: string;
  role: string;
  isAllChaps: boolean;
  chaps: any[];
  chapsCount: number;
  book: Book;
}
