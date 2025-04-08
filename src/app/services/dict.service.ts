import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Observable, of as ObservableOf } from 'rxjs/';
import { map, share } from 'rxjs/operators';

import { DictEntry, PosMeanings } from '../models/dict-entry';
import { BaseService } from './base.service';

@Injectable()
export class DictService extends BaseService<DictEntry> {

  private _entryHistory: DictEntry[] = [];
  private entryCache: Map<string, DictEntry> = new Map();
  private baseFormsMap: Map<string, string>;

  entryHistoryCapacity = 10;

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/dict`;
  }

  clearCache() {
    this.entryCache.clear();
    this.clearHistory();
  }

  clearHistory() {
    this._entryHistory = [];
  }

  get entryHistory(): DictEntry[] {
    return this._entryHistory;
  }

  private pushHistory(entry) {
    let eh = this._entryHistory;
    let inHistory = eh.find(e => e.word === entry.word);
    if (!inHistory) {
      eh.push(entry);
    }
    if (eh.length > this.entryHistoryCapacity) {
      eh.shift();
    }
  }

  private cacheOne(obs: Observable<DictEntry>, putInHistory = true): Observable<DictEntry> {
    obs.pipe(share()).subscribe(entry => {
      if (entry) {
        if (putInHistory) {
          this.pushHistory(entry);
        }
        this.entryCache.set(entry.word, entry);
      }
    });
    return obs;
  }

  getEntry(idOrWord: string, options: any = {}): Observable<DictEntry> {
    let cachedEntry = this.entryCache.get(idOrWord);
    if (cachedEntry) {
      if (!options.complete || typeof cachedEntry.complete !== 'undefined') {
        return ObservableOf(cachedEntry);
      }
    }
    let url = `${this.baseUrl}/${idOrWord}`;
    let switches = ['base', 'stem', 'complete'].filter(name => options[name]);
    if (switches.length > 0) {
      url += '?';
      url += switches.join('&');
    }

    return this.cacheOne(this.getOneByUrl(url));
  }

  getCompleteMeanings(idOrWord: string): Observable<PosMeanings[]> {
    let cachedEntry = this.entryCache.get(idOrWord);
    if (cachedEntry) {
      if (typeof cachedEntry.complete !== 'undefined') {
        return ObservableOf(cachedEntry.complete);
      }
    }

    let url = `${this.baseUrl}/${idOrWord}/complete`;
    let obs = this.http.get<PosMeanings[]>(url, this.httpOptions);
    if (!cachedEntry) {
      return obs;
    }
    obs = obs.pipe(share());
    obs.subscribe((complete: PosMeanings[]) => {
      cachedEntry.complete = complete;
    });
    return obs;
  }


  search(key: string, options?): Observable<DictEntry[]> {
    let limit = options.limit;
    if (!limit) {
      limit = 8;
    }
    let url = `${this.baseUrl}/search/${key}?limit=${limit}`;

    let switches = ['phrase', 'phraseOnly', 'basic', 'cet', 'gre']
      .filter(name => options[name]);
    if (switches.length > 0) {
      url += '&';
      url += switches.join('&');
    }

    return this.list(url);
  }

  loadBaseForms(): Observable<Map<string, string>> {
    if (this.baseFormsMap) {
      return ObservableOf(this.baseFormsMap);
    }

    let url = `${this.baseUrl}/baseForms/b6`;
    return this.http.get<any[]>(url, this.httpOptions)
      .pipe(map((words: string[][]) => {
        this.baseFormsMap = new Map();
        for (let [word, base] of words) {
          this.baseFormsMap.set(word, base);
        }
        return this.baseFormsMap;
      }), share());
  }

}
