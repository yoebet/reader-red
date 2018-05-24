import {Model} from './model';

export class UserWord extends Model {
  word: string;
  bookId: string;
  chapId: string;
  paraId: string;
  familiarity: number = 1;
  createdDateParts?: any;
  createdMoment?: any;

  static Familiarities = [
    {value: 1, label: '很陌生'},
    {value: 2, label: '熟悉中'},
    {value: 3, label: '已掌握'}
  ];
}
