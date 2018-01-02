import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/catch';

import {Para} from '../models/para';
import {BaseService} from './base.service';
import {ChapService} from './chap.service';
import {BookService} from './book.service';

@Injectable()
export class ParaService extends BaseService<Para> {

  constructor(protected http: HttpClient,
              private bookService: BookService,
              private chapService: ChapService) {
    super(http);
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
        let {bookId, chapId} = para;
        Observable.combineLatest(
          this.bookService.getOne(bookId),
          this.chapService.getOne(chapId))
          .subscribe(([book, chap]) => {
            if (book) {
              para.book = book;
            }
            if (chap) {
              para.chap = chap;
            }
            observer.next(para);
            observer.complete();
          });
      });
    });
  }

  textSearch(word: string, options: any = {}): Observable<Para[]> {
    let {limit} = options;
    if (!limit) {
      limit = 8;
    }
    let url = `${this.baseUrl}/search/${word}?limit=${limit}`;
    return this.list(url);
  }

}
