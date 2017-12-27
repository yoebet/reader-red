import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
// import 'rxjs/add/operator/share';

import {Book} from '../models/book';
import {BaseService} from './base.service';

@Injectable()
export class BookService extends BaseService<Book> {


  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}books`;
  }


  // getDetail(id: string): Observable<Book> {
  //   const url = `${this.baseUrl}/${id}/detail`;
  //   return this.http.get<Book[]>(url, this.httpOptions)
  //     .catch(this.handleError);
  // }

}
