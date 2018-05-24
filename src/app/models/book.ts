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

  chaps: Chap[];

  userBook: UserBook;


  static LangTypes = [
    {value: 'EZ', label: '英文原著 - 中文译文'},
    {value: 'ZE', label: '英文译文 - 中文原著'},
    {value: 'CZ', label: '文言文 - 现代文/注释'}
  ];

}
