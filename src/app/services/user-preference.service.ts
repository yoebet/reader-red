import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import {OpResult} from '../models/op-result';
import {BaseService} from './base.service';
import {UserPreference} from "../models/user-preference";

@Injectable()
export class UserPreferenceService extends BaseService<UserPreference> {

  userPreference: UserPreference;

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_preferences`;
  }

  get(): Observable<UserPreference> {
    if (this.userPreference) {
      return Observable.of(this.userPreference);
    }
    let obs = super.getOneByUrl(this.baseUrl)
      .map((up: UserPreference) => {
        return up ? up : new UserPreference();
      }).share();
    obs.subscribe((up: UserPreference) => {
      this.userPreference = up;
    });
    return obs;
  }

  getBaseVocabulary(): Observable<string> {
    return this.get().map((up: UserPreference) => {
      return up.baseVocabulary;
    });
  }

  getWordTags(): Observable<string[]> {
    return this.get().map((up: UserPreference) => {
      return up.wordTags;
    });
  }

  setBaseVocabulary(categoryCode: string): Observable<OpResult> {
    if (this.userPreference) {
      this.userPreference.baseVocabulary = categoryCode;
    }
    let url = this.baseUrl + '/baseVocabulary';
    return this.http.post<OpResult>(url, {categoryCode}, this.httpOptions).catch(this.handleError);
  }

  setWordTags(categoryCodes: string[]): Observable<OpResult> {
    if (this.userPreference) {
      this.userPreference.wordTags = categoryCodes;
    }
    let url = this.baseUrl + '/wordTags';
    return this.http.post<OpResult>(url, categoryCodes, this.httpOptions).catch(this.handleError);
  }
}
