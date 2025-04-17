import {Model} from './model';

import * as moment from 'moment';

export class UserWord extends Model {
  word: string;
  bookId: string;
  chapId: string;
  paraId: string;
  familiarity = 1;
  // lastTouch: string;
  createdDateParts?: { year: number, month: number, dayOfMonth: number, weekOfYear: number, dayOfWeek: number, dateString: string };
  createdMoment?: moment.Moment;

  markRemoved = false;

  static Familiarities = [
    {value: 1, label: '在学'},
    {value: 2, label: '熟悉'},
    {value: 3, label: '掌握'}
  ];

  static FamiliarityLowest = 1;
  static FamiliarityHighest = 3;

  static ensureCreatedDate(userWord) {
    if (userWord.createdMoment) {
      return;
    }
    let time = Model.createdTime(userWord);
    userWord.createdMoment = moment(time);
    let date = userWord.createdMoment;
    let dayOfWeek = date.day();
    let weekOfYear = date.week();
    let dayOfMonth = date.date(); // 1-31
    let month = date.month(); // 0-11
    let year = date.year();
    let dateString = `${year}-${month + 1}-${dayOfMonth}`;
    userWord.createdDateParts = {year, month, dayOfMonth, weekOfYear, dayOfWeek, dateString};
  }
}
