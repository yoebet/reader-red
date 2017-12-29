import {Model} from './model';
import {Chap} from './chap';
import {UserBook} from './user_book';

export class Book extends Model {
  name: string;
  zhName: string = '';
  author: string = '';
  zhAuthor: string = '';
  chaps: Chap[];

  userBook: UserBook;
}
