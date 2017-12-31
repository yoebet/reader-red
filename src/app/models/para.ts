import {Model} from './model';
import {Chap} from './chap';

export class Para extends Model {
  content: string = '';
  trans: string = '';
  chapId: string;

  chap: Chap;
}
