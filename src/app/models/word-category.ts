import {Model} from './model';

export class WordCategory extends Model {
  code: string;
  name: string;
  dictCategoryKey: string;
  dictCategoryValue: number;
  description: string;
  wordCount: number;
  extendTo: string;
  extendedWordCount: number;

  extend: WordCategory;
}
