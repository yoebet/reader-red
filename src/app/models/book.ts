import {Model} from './model';
import {Chap} from './chap';
import {UserBook} from './user-book';

export class Book extends Model {
  name: string;
  zhName: string = '';
  author: string = '';
  zhAuthor: string = '';
  langType: string;
  originalId: string;
  isFree: boolean;
  tags: string;
  annotationFamilyId: string;

  chaps: Chap[];

  userBook: UserBook;

}
