import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { Observable, of as ObservableOf } from 'rxjs/';
import { catchError, map, share, tap } from 'rxjs/operators';
import { sortedIndexBy } from 'lodash';

import { environment } from '../../environments/environment';
import { UserWord } from '../models/user-word';
import { OpResult } from '../models/op-result';
import { BaseService } from './base.service';
import { SessionService } from './session.service';

@Injectable()
export class UserWordService extends BaseService<UserWord> {

  private allWords: UserWord[];
  private userWordsMap: Map<string, UserWord>;
  private latestAdded0: UserWord[] = [];
  private latestAddedCapacity = 10;

  private allWords$: Observable<UserWord[]>;


  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_words`;
  }

  clearCache() {
    this.allWords = null;
    this.allWords$ = null;
    this.userWordsMap.clear();
    this.latestAdded0 = [];
  }

  get latestAdded() {
    return this.latestAdded0;
  }

  private pushLatest(userWord) {
    if (userWord.familiarity === UserWord.FamiliarityHighest) {
      return;
    }
    let la = this.latestAdded0;
    let inLatestAdded = la.find(uw => uw.word === userWord.word);
    if (!inLatestAdded) {
      la.push(userWord);
    }
    if (la.length > this.latestAddedCapacity) {
      la.shift();
    }
  }

  private removeFromLatest(userWord) {
    let la = this.latestAdded0;
    let index = la.indexOf(userWord);
    if (index >= 0) {
      la.splice(index, 1);
    }
  }


  private updateLatest(uw, firstSetup = false) {
    let la = this.latestAdded0;
    if (!firstSetup && uw.familiarity === UserWord.FamiliarityHighest) {
      let idx = la.indexOf(uw);
      if (idx >= 0) {
        la.splice(idx, 1);
      }
      return;
    }
    if (la.length === 0) {
      la.push(uw);
      return;
    }
    if (la.indexOf(uw) >= 0) {
      return;
    }
    let last = la[la.length - 1];
    if (uw.createdMoment.isAfter(last.createdMoment)) {
      la.push(uw);
      if (la.length > this.latestAddedCapacity) {
        la.shift();
      }
      return;
    }
    let insertIndex = sortedIndexBy(la, uw, o => o.createdMoment.valueOf());
    if (insertIndex === 0) {
      if (la.length < this.latestAddedCapacity) {
        la.unshift(uw);
      }
      return;
    }
    la.splice(insertIndex, 0, uw);
    if (la.length > this.latestAddedCapacity) {
      la.shift();
    }
  }

  getOne(word: string): Observable<UserWord> {
    if (this.userWordsMap) {
      let userWord = this.userWordsMap.get(word);
      return ObservableOf(userWord);
    }
    return this.getUserWordsMap().pipe(
      map(uwm => {
        if (uwm) {
          return uwm.get(word);
        }
        return null;
      }));
  }

  reloadAll(): Observable<UserWord[]> {
    this.allWords = null;
    this.allWords$ = null;
    return this.loadAll();
  }

  loadAll(): Observable<UserWord[]> {
    if (this.allWords) {
      return ObservableOf(this.allWords);
    }
    if (this.allWords$) {
      return this.allWords$;
    }
    let obs = super.list(this.baseUrl).pipe(
      map((userWords: UserWord[]) => {
        this.allWords = userWords;
        this.allWords$ = null;
        if (this.userWordsMap) {
          this.userWordsMap.clear();
        } else {
          this.userWordsMap = new Map();
        }
        this.latestAdded0 = [];
        for (let uw of userWords) {
          this.userWordsMap.set(uw.word, uw);
          UserWord.ensureCreatedDate(uw);
          this.updateLatest(uw, true);
        }
        return userWords;
      }),
      share()
    );

    this.allWords$ = obs;
    return obs;
  }

  getUserWordsMap(): Observable<Map<string, UserWord>> {
    if (this.userWordsMap) {
      return ObservableOf(this.userWordsMap);
    }
    return this.loadAll().pipe(map(_ => this.userWordsMap));
  }

  create(userWord: UserWord): Observable<UserWord> {
    return this.http.post<UserWord>(this.baseUrl, userWord, this.httpOptions)
      .pipe(
        tap((result: UserWord) => {
          if (!result) {
            return;
          }
          // userWord._id = result._id;
          UserWord.ensureCreatedDate(userWord);
          if (this.userWordsMap) {
            this.userWordsMap.set(userWord.word, userWord);
          }
          if (this.allWords) {
            this.allWords.push(userWord);
          }
          this.pushLatest(userWord);
        }),
        catchError(this.handleError));
  }

  update(userWord: UserWord): Observable<OpResult> {
    const url = `${this.baseUrl}/${userWord.word}`;
    let up = { familiarity: userWord.familiarity };
    return this.http.put<OpResult>(url, up, this.httpOptions)
      .pipe(
        tap((opr: OpResult) => {
          if (opr.ok === 1) {
            this.updateLatest(userWord);
          }
        }),
        catchError(this.handleError));
  }

  remove(word: string): Observable<OpResult> {
    const url = `${this.baseUrl}/${word}`;
    return this.http.delete<OpResult>(url, this.httpOptions)
      .pipe(
        tap((opr: OpResult) => {
          if (opr.ok === 1) {
            let userWord: UserWord;
            if (this.userWordsMap) {
              userWord = this.userWordsMap.get(word);
              if (!userWord) {
                return;
              }
              this.userWordsMap.delete(word);
            }
            if (this.allWords) {
              const index = this.allWords.findIndex((uw => uw.word === word));
              if (index >= 0) {
                this.allWords.splice(index, 1);
              }
            }
            if (userWord) {
              this.removeFromLatest(userWord);
            }
          }
        }),
        catchError(this.handleError));
  }


  resetAll(userWords: {
    word: string;
    familiarity?: number;
  }[]): Observable<OpResult> {
    const url = `${this.baseUrl}/resetAll`;
    return this.http.post<OpResult>(url, userWords, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

}
