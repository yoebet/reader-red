import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';

import { map, switchMap } from 'rxjs/operators';
import { Observable, of as ObservableOf } from 'rxjs/';

import { environment } from '../../environments/environment';
import { BookCategory } from '../models/book-category';
import { SessionService } from './session.service';
import { BaseService } from './base.service';

@Injectable()
export class BookCategoryService extends BaseService<BookCategory> {

  private categoryNames: Record<string, string> = undefined;

  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/book_categories`;
  }

  getCategoryNames(): Observable<Record<string, string>> {
    if (this.categoryNames) {
      return ObservableOf(this.categoryNames);
    }
    return this.listOptions()
      .pipe(switchMap(cs => ObservableOf(this.categoryNames)));
  }

  listOptions(): Observable<BookCategory[]> {
    let url = `${this.baseUrl}/pairs`;
    return super.list(url)
      .pipe(map(cs => {
          if (!this.categoryNames) {
            this.categoryNames = {};
          }
          for (const c of cs) {
            this.categoryNames[c.code] = c.name;
          }
          return cs;
        })
      );
  }

}
