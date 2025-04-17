import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { Observable } from 'rxjs/';

import { environment } from '../../environments/environment';
import { UserBook } from '../models/user-book';
import { BaseService } from './base.service';
import { SessionService } from './session.service';

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

}
