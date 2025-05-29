import { Model } from './model';

export class User extends Model {
  name: string;
  nickName: string;
  role: string;
  status: string;
  passSet?: boolean;

  accessToken?: string;
  avatarSetting?: {
    type: 'img';
    imgUrl: string,
  }|{
    type: 'char',
    charText: string,
    charBgColor: string,
    charTextColor: string
  };
  vip?: string; // A/B/C

  // static Roles = ['', 'A', 'E'];
}

export class UserIdName {
  // tslint:disable-next-line:variable-name
  _id: string;
  name: string;
  nickName: string;
}


export class RegisterForm {
  name = '';
  nickName = '';
  pass = '';
  frc?: string;
}
