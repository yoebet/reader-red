import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import {BaseService} from './base.service';
import {WordCategory} from "../models/word-category";

@Injectable()
export class WordCategoryService extends BaseService<WordCategory> {

  wordCategories: WordCategory[];
  wordCategoriesMap: Map<string, WordCategory>;

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/word_categories`;
  }

  list(): Observable<WordCategory[]> {
    if (this.wordCategories) {
      return Observable.of(this.wordCategories);
    }
    return super.list().map((cats: WordCategory[]) => {
      // setup extend
      let catsMap = new Map();
      for (let cat of cats) {
        catsMap.set(cat.code, cat);
      }
      for (let cat of cats) {
        if (cat.extendTo) {
          cat.extend = catsMap.get(cat.extendTo);
        }
      }
      this.wordCategoriesMap = catsMap;
      this.wordCategories = cats;
      return cats;
    });
  }

  listUserBaseCandidates(): Observable<WordCategory[]> {
    return this.list()
      .map((wcs: WordCategory[]) => {
        return wcs.filter(wc => wc.useAsUserBase);
      });
  }


  fetchSampleWords(code, limit = 20): Observable<string[]> {
    let url = `${this.baseUrl}/${code}/sample`;
    if (limit) {
      url = url + '?limit=' + limit;
    }
    return this.http.post<string[]>(url, null, this.httpOptions)
      .catch(this.handleError);
  }

}
