import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
// import 'rxjs/add/operator/share';

import {Book} from '../models/book';
import {UserBook} from '../models/user_book';
import {BaseService} from './base.service';
import {UserService} from './user.service';

@Injectable()
export class BookService extends BaseService<Book> {

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/books`;
  }

  // myBooks(): Observable<Book[]> {
  //   let url = `${this.baseUrl}/my_books`;
  //   return this.http.get<Book[]>(url, this.httpOptions)
  //     .catch(this.handleError);
  // }
  //
  // myBookConfigs(): Observable<UserBook[]> {
  //   let url = `${this.baseUrl}/my_book_configs`;
  //   return this.http.get<UserBook[]>(url, this.httpOptions)
  //     .catch(this.handleError);
  // }
  //
  // myBookConfig(bookId): Observable<UserBook> {
  //   let url = `${this.baseUrl}/${bookId}/my_book_config`;
  //   return this.http.get<UserBook>(url, this.httpOptions)
  //     .catch(this.handleError);
  // }

}
