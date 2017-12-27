import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';

import {User} from '../models/user';
import {UserBook} from '../models/user_book';
import {BaseService} from './base.service';

@Injectable()
export class UserService extends BaseService<User> {

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}users`;
  }


  userBooks(userId: string): Observable<UserBook[]> {
    let url = `${this.baseUrl}/${userId}/books`;
    return this.http.get<UserBook[]>(url, this.httpOptions)
      .catch(this.handleError);
  }

}
