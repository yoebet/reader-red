import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Observable, of as ObservableOf } from 'rxjs/';
import { map, share } from 'rxjs/operators';

import { BaseService } from './base.service';
import { WordCategory } from '../models/word-category';

@Injectable()
export class WordCategoryService extends BaseService<WordCategory> {

  wordCategories: WordCategory[];
  wordCategoriesMap: Map<string, WordCategory>;

  //categoryCode -> words
  private allWordsMap = new Map<string, string[]|Observable<string[]>>();

  private cachedCategories = ['junior1', 'junior2', 'basic', 'cet4', 'cet6', 'cet', 'gre', 'ielts'];


  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/word_categories`;
  }

  list(): Observable<WordCategory[]> {
    if (this.wordCategories) {
      return ObservableOf(this.wordCategories);
    }
    return super.list().pipe(map((cats: WordCategory[]) => {
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
    }));
  }

  getCategoriesMap(): Observable<Map<string, WordCategory>> {
    if (this.wordCategories) {
      return ObservableOf(this.wordCategoriesMap);
    }
    return this.list().pipe(map(cats => this.wordCategoriesMap));
  }

  getCategory(code: string): Observable<WordCategory> {
    if (this.wordCategories) {
      return ObservableOf(this.wordCategoriesMap.get(code));
    }
    return this.getCategoriesMap().pipe(map(catsMap => catsMap.get(code)));
  }

  fetchSampleWords(code, limit = 20): Observable<string[]> {
    let url = `${this.baseUrl}/${code}/sample`;
    if (limit) {
      url = url + '?limit=' + limit;
    }
    return this.http.post<string[]>(url, null, this.httpOptions);
  }

  loadAllWords(code): Observable<string[]> {
    let words = this.allWordsMap.get(code);
    if (words) {
      if (typeof words['subscribe'] === 'function') {
        return words as Observable<string[]>;
      } else {
        return ObservableOf(words as string[]);
      }
    }

    if (this.cachedCategories.indexOf(code) === -1) {
      return ObservableOf([]);
    }

    let url = `${this.baseUrl}/word_book/${code}`;
    let obs = this.http.get<{ code: string, version: number, words: string[] }>(url, this.httpOptions)
      .pipe(map(wb => wb.words), share());
    this.allWordsMap.set(code, obs);
    obs.subscribe((words2: string[]) => {
      this.allWordsMap.set(code, words2);
    });
    return obs;
  }

}
