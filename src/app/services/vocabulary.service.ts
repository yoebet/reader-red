import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';

import {UserWord} from '../models/user_word';
import {OpResult} from '../models/op-result';
import {BaseService} from './base.service';
import {AppService} from './app.service';

@Injectable()
export class VocabularyService extends BaseService<UserWord> {

  allWords: UserWord[];
  userWordsMap = new Map<string, UserWord>();

  constructor(protected http: HttpClient, appService: AppService) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/voca`;

    appService.onCurrentUserChanged.subscribe(change => {
      this.clearCache();
    });
  }

  clearCache() {
    this.allWords = null;
    this.userWordsMap.clear();
  }

  getOne(word: string): Observable<UserWord> {
    let userWord = this.userWordsMap.get(word);
    if (userWord) {
      return Observable.of(userWord);
    }
    let obs = super.getOne(word) as Observable<UserWord>;
    obs = obs.share();
    obs.subscribe((uw: UserWord) => {
      if (uw) {
        this.userWordsMap.set(uw.word, uw);
      }
    });
    return obs;
  }

  list(): Observable<UserWord[]> {
    if (this.allWords) {
      return Observable.of(this.allWords);
    }
    let obs = super.list() as Observable<UserWord[]>;
    obs = obs.share();
    obs.subscribe((userWords: UserWord[]) => {
      if (userWords.length === 0) {
        return;
      }
      this.allWords = userWords;
      for (let uw of userWords) {
        this.userWordsMap.set(uw.word, uw);
      }
    });
    return obs;
  }

  create(userWord: UserWord): Observable<UserWord> {
    let obs = this.http.post<UserWord>(this.baseUrl, userWord, this.httpOptions)
      .catch(this.handleError);
    obs = obs.share();
    obs.subscribe((result: UserWord) => {
      if (result && result._id) {
        userWord._id = result._id;
        this.userWordsMap.set(userWord.word, userWord);
        if (this.allWords) {
          this.allWords.push(userWord);
        }
      }
    });
    return obs;
  }

  update(userWord: UserWord): Observable<OpResult> {
    const url = `${this.baseUrl}/${userWord.word}`;
    let up = {familiarity: userWord.familiarity};
    return this.http.put<OpResult>(url, up, this.httpOptions)
      .catch(this.handleError);
  }

  remove(word: string): Observable<OpResult> {
    const url = `${this.baseUrl}/${word}`;
    let obs = this.http.delete<OpResult>(url, this.httpOptions)
      .catch(this.handleError);
    obs = obs.share();
    obs.subscribe((opr: OpResult) => {
      if (opr.ok === 1) {
        this.userWordsMap.delete(word);
        if (this.allWords) {
          this.allWords = this.allWords.filter(uw => uw.word !== word);
        }
      }
    });
    return obs;
  }

  sync(userWords: UserWord[]): Observable<OpResult> {
    const url = `${this.baseUrl}/sync`;
    userWords = userWords.map(userWord => {
      let {word, familiarity} = userWord;
      let uw: any = {word, familiarity};
      if (!userWord._id) {
        for (let attr of ['bookId', 'chapId', 'paraId']) {
          if (userWord[attr]) {
            uw[attr] = userWord[attr];
          }
        }
      }
      return uw;
    });
    return this.http.post<OpResult>(url, userWords, this.httpOptions)
      .catch(this.handleError);
  }

}
