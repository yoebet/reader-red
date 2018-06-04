import {EventEmitter, Injectable} from '@angular/core';
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
  private userPreference$: Observable<UserPreference>;

  readonly onBaseVocabularyChanged = new EventEmitter<string>();

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_preferences`;
  }

  get(): Observable<UserPreference> {
    if (this.userPreference) {
      return Observable.of(this.userPreference);
    }
    if (this.userPreference$) {
      return this.userPreference$;
    }
    this.userPreference$ = super.getOneByUrl(this.baseUrl)
      .map((up: UserPreference) => {
        return up ? up : new UserPreference();
      }).share();
    this.userPreference$.subscribe((up: UserPreference) => {
      this.userPreference = up;
      if (up.baseVocabulary) {
        this.onBaseVocabularyChanged.emit(up.baseVocabulary);
      }
    });
    return this.userPreference$;
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
    let url = this.baseUrl + '/baseVocabulary';
    let obs = this.http.post<OpResult>(url, {categoryCode}, this.httpOptions).catch(this.handleError);
    obs = obs.share();
    obs.subscribe(opr => {
      if (opr && opr.ok === 1) {
        if (this.userPreference) {
          this.userPreference.baseVocabulary = categoryCode;
        }
        this.onBaseVocabularyChanged.emit(categoryCode);
      }
    });
    return obs;
  }

  setWordTags(categoryCodes: string[]): Observable<OpResult> {
    let url = this.baseUrl + '/wordTags';
    let obs = this.http.post<OpResult>(url, categoryCodes, this.httpOptions).catch(this.handleError);
    obs = obs.share();
    obs.subscribe(opr => {
      if (opr && opr.ok === 1) {
        if (this.userPreference) {
          this.userPreference.wordTags = categoryCodes;
        }
      }
    });
    return obs;
  }
}
