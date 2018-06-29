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

  //categoryCode -> words
  private allWordsMap = new Map<string, string[] | Observable<string[]>>();

  private cachedCategories = ['junior1', 'junior2', 'basic', 'cet4', 'cet6', 'cet', 'gre', 'yasi'];


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
      let catsMap = this.wordCategoriesMap;
      if (catsMap) {
        catsMap.clear();
      } else {
        catsMap = this.wordCategoriesMap = new Map();
      }
      for (let cat of cats) {
        catsMap.set(cat.code, cat);
      }
      for (let cat of cats) {
        if (cat.extendTo) {
          cat.extend = catsMap.get(cat.extendTo);
        }
      }
      this.wordCategories = cats;
      return cats;
    });
  }

  getCategoriesMap(): Observable<Map<string, WordCategory>> {
    if (this.wordCategories) {
      return Observable.of(this.wordCategoriesMap);
    }
    return this.list().map(cats => this.wordCategoriesMap);
  }

  getCategory(code: string): Observable<WordCategory> {
    if (this.wordCategories) {
      return Observable.of(this.wordCategoriesMap.get(code));
    }
    return this.getCategoriesMap().map(catsMap => catsMap.get(code));
  }

  fetchSampleWords(code, limit = 20): Observable<string[]> {
    let url = `${this.baseUrl}/${code}/sample`;
    if (limit) {
      url = url + '?limit=' + limit;
    }
    return this.http.post<string[]>(url, null, this.httpOptions)
      .catch(this.handleError);
  }

  loadAllWords(code): Observable<string[]> {
    let words = this.allWordsMap.get(code);
    if (words) {
      if (typeof words['subscribe'] === 'function') {
        return words as Observable<string[]>;
      } else {
        return Observable.of(words);
      }
    }

    if (this.cachedCategories.indexOf(code) === -1) {
      return Observable.of([]);
    }

    let url = `${this.baseUrl}/${code}/loadAll`;
    let obs = this.http.post<string[]>(url, null, this.httpOptions)
      .catch(this.handleError).share();
    this.allWordsMap.set(code, obs);
    obs.subscribe((words: string[]) => {
      this.allWordsMap.set(code, words);
    });
    return obs;
  }

}
