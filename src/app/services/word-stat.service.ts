import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { Observable } from 'rxjs/';
import { catchError } from 'rxjs/operators';
import { BaseService } from './base.service';
import { WordStat } from '../models/word-stat';
import { SessionService } from './session.service';
import { environment } from '../../environments/environment';

@Injectable()
export class WordStatService extends BaseService<WordStat> {

  bookStatBaseUrl: string;
  chapStatBaseUrl: string;

  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.bookStatBaseUrl = `${apiBase}/books`;
    this.chapStatBaseUrl = `${apiBase}/chaps`;
  }


  getBookStat(bookId: string): Observable<WordStat> {
    const url = `${this.bookStatBaseUrl}/${bookId}/wordStat`;
    return super.getOneByUrl(url);
  }

  getBookWordsForCat(bookId: string, cat: string): Observable<string[]> {
    const url = `${this.bookStatBaseUrl}/${bookId}/words/${cat}`;
    return this.http.get<string[]>(url, this.httpOptions).pipe(
      catchError(this.handleError));
  }

  getChapStat(chapId: string): Observable<WordStat> {
    const url = `${this.chapStatBaseUrl}/${chapId}/wordStat`;
    return super.getOneByUrl(url);
  }

  getChapWordsForCat(chapId: string, cat: string): Observable<string[]> {
    const url = `${this.chapStatBaseUrl}/${chapId}/words/${cat}`;
    return this.http.get<string[]>(url, this.httpOptions).pipe(
      catchError(this.handleError));
  }

}
