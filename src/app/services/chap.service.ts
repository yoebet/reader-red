import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';

import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {BaseService} from './base.service';

@Injectable()
export class ChapService extends BaseService<Chap> {

  chapsMap = new Map<string, Chap>();

  protected bookBaseUrl: string;

  constructor(protected http: HttpClient) {
    super(http);
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
    let obs = super.getDetail(id) as Observable<Chap>;
    obs = obs.share();
    obs.subscribe((chap: Chap) => {
      this.cacheChap(chap);
    });
    return obs;
  }


  getOne(id: string): Observable<Chap> {
    let chap = this.chapsMap.get(id);
    if (chap) {
      return Observable.of(chap);
    }
    let obs = super.getOne(id) as Observable<Chap>;
    obs = obs.share();
    obs.subscribe((chap: Chap) => {
      this.cacheChap(chap);
    });
    return obs;
  }

}

