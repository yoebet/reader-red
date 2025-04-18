import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { Observable } from 'rxjs/';

import { environment } from '../../environments/environment';
import { UserBook } from '../models/user-book';
import { BaseService } from './base.service';
import { SessionService } from './session.service';
import { OpResult } from '../models/op-result';
import { catchError } from 'rxjs/operators';

@Injectable()
export class UserBookService extends BaseService<UserBook> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_books`;
  }

  getOne(bookId: string): Observable<UserBook> {
    return super.getOne(bookId);
  }

  resetTextSearch(bookIds: string[]) {
    const url = `${this.baseUrl}/textSearch/all`;
    return super.postForOpResult(url, bookIds);
  }

  addToTextSearch(bookId: string) {
    const url = `${this.baseUrl}/${bookId}/textSearch`;
    return super.postForOpResult(url);
  }

  removeFromTextSearch(bookId: string) {
    const url = `${this.baseUrl}/${bookId}/textSearch`;
    return this.http.delete<OpResult>(url, this.httpOptions).pipe(
      catchError(this.handleError));
  }

}
