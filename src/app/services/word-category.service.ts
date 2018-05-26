import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';

import {BaseService} from './base.service';
import {WordCategory} from "../models/word_category";

@Injectable()
export class WordCategoryService extends BaseService<WordCategory> {

  wordCategories: WordCategory[];

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/word_categories`;
  }

  list(): Observable<WordCategory[]> {
    if (this.wordCategories) {
      return Observable.of(this.wordCategories);
    }
    let obs = super.list(this.baseUrl + '/?userBase').share();
    obs.subscribe(wcs => {
      this.wordCategories = wcs;
    });
    return obs;
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
