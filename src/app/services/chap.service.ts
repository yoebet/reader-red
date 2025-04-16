import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Observable, of as ObservableOf } from 'rxjs/';
import { catchError, map, share } from 'rxjs/operators';

import { Book } from '../models/book';
import { Chap } from '../models/chap';
import { BaseService } from './base.service';
import { SessionService } from './session.service';
import { SuiModalService } from 'ng2-semantic-ui';
import { ParaIdCount } from '../models/para';

@Injectable()
export class ChapService extends BaseService<Chap> {

  chapsMap = new Map<string, Chap>();

  protected bookBaseUrl: string;

  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.bookBaseUrl = `${apiBase}/books`;
    this.baseUrl = `${apiBase}/chaps`;
  }

  clearCache() {
    this.chapsMap.clear();
  }

  private cacheChap(chap: Chap) {
    let cloned = new Chap();
    Object.assign(cloned, chap);
    cloned.paras = null;
    this.chapsMap.set(cloned._id, cloned);
  }

  cacheBookChaps(book: Book) {
    let chaps = book.chaps;
    if (!chaps) {
      return;
    }
    for (let chap of chaps) {
      let cloned = new Chap();
      Object.assign(cloned, chap);
      cloned.bookId = book._id;
      cloned.paras = null;
      this.chapsMap.set(cloned._id, cloned);
    }
  }

  getDetail(id: string): Observable<Chap> {
    let obs = super.getDetail(id).pipe(share());
    obs.subscribe((chap: Chap) => {
      this.cacheChap(chap);
    });
    return obs;
  }


  getOne(id: string): Observable<Chap> {
    let chap0 = this.chapsMap.get(id);
    if (chap0) {
      return ObservableOf(chap0);
    }
    let obs = super.getOne(id).pipe(share());
    obs.subscribe((chap: Chap) => {
      this.cacheChap(chap);
    });
    return obs;
  }

  loadCommentsCount(chap: Chap): Observable<number> {
    if (!chap || !chap.paras || chap.paras.length === 0) {
      return ObservableOf(0);
    }

    let url = `${this.baseUrl}/${chap._id}/paraCommentsCount`;
    return this.http.get<ParaIdCount[]>(url, this.httpOptions)
      .pipe(
        map((idCounts: ParaIdCount[]) => {
          let parasMap = new Map();
          for (let p of chap.paras) {
            p.commentsCount = 0;
            parasMap.set(p._id, p);
          }

          let total = 0;
          for (let { paraId, count } of idCounts) {
            total += count;
            let para = parasMap.get(paraId);
            if (para) {
              para.commentsCount = count;
            }
          }
          chap.paraCommentsCountLoaded = true;
          return total;
        }),
        catchError(this.handleError));
  }

}

