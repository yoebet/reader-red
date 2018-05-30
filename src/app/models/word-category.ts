import {Model} from './model';

export class WordCategory extends Model {
  code: string;
  name: string;
  // dictKey: string;
  // dictValue: number;
  // dictOperator: string;
  description: string;
  wordCount: number;
  extendTo: string;
  extendedWordCount: number;
  useAsUserBase: boolean;

  extend: WordCategory;
}
