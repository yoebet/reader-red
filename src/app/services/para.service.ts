import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { combineLatest, Observable } from 'rxjs/';
import { catchError, map } from 'rxjs/operators';
import { uniq } from 'lodash';

import { environment } from '../../environments/environment';
import { Chap } from '../models/chap';
import { Para } from '../models/para';
import { BaseService } from './base.service';
import { ChapService } from './chap.service';
import { BookService } from './book.service';
import { SessionService } from './session.service';
import { ParaComment } from '../models/para-comment';

@Injectable()
export class ParaService extends BaseService<Para> {

  constructor(protected http: HttpClient,
              private bookService: BookService,
              private chapService: ChapService,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/paras`;
  }

  loadPara(id: string) {
    return Observable.create(observer => {
      this.getOne(id).subscribe((para: Para) => {
        if (!para) {
          observer.next(null);
          observer.complete();
          return;
        }
        let { bookId, chapId } = para;
        combineLatest(
          this.bookService.getOne(bookId),
          this.chapService.getOne(chapId))
          .subscribe(([book, chap]) => {
            para.book = book;
            para.chap = chap as Chap;
            observer.next(para);
            observer.complete();
          });
      });
    });
  }

  textSearch(word: string, options: any = {}): Observable<Para[]> {
    let { limit } = options;
    if (!limit) {
      limit = 8;
    }
    let url = `${this.baseUrl}/search/${word}?limit=${limit}`;

    return Observable.create(observer => {
      this.list(url).subscribe((paras: Para[]) => {
        if (!paras || paras.length === 0) {
          observer.next([]);
          observer.complete();
        }
        let bookIds = uniq<string>(paras.map(p => p.bookId).filter(bookId => bookId != null));
        let chapIds = uniq<string>(paras.map(p => p.chapId).filter(chapId => chapId != null));
        let booksObs: Observable<any>[] = bookIds.map(bookId => this.bookService.getOne(bookId));
        let chapsObs: Observable<any>[] = chapIds.map(chapId => this.chapService.getOne(chapId));
        combineLatest(booksObs.concat(chapsObs)).subscribe(bookOrChaps => {
          let bookOrChapMap = new Map();
          for (let boc of bookOrChaps) {
            bookOrChapMap.set(boc._id, boc);
          }
          for (let para of paras) {
            para.book = bookOrChapMap.get(para.bookId);
            para.chap = bookOrChapMap.get(para.chapId);
          }
          observer.next(paras);
          observer.complete();
        });
      });
    });
  }

  loadComments(para: Para): Observable<ParaComment[]> {
    let url = `${this.baseUrl}/${para._id}/comments`;
    return this.http.get<ParaComment[]>(url, this.httpOptions)
      .pipe(
        map((comments: ParaComment[]) => {
          para.comments = comments;
          return comments;
        }),
        catchError(this.handleError));
  }

}
