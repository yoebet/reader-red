import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/share';

import {DictEntry, PosMeanings} from '../models/dict-entry';
import {BaseService} from './base.service';

@Injectable()
export class DictService extends BaseService<DictEntry> {

  private _entryHistory: DictEntry[] = [];
  private entryCache: Map<string, DictEntry> = new Map();
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
    obs = obs.share();
    obs.subscribe(entry => {
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
        return Observable.of(cachedEntry);
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
        return Observable.of(cachedEntry.complete);
      }
    }

    let url = `${this.baseUrl}/${idOrWord}/complete`;
    let obs = this.http.get<PosMeanings[]>(url, this.httpOptions)
      .catch(this.handleError);
    if (!cachedEntry) {
      return obs;
    }
    obs = obs.share();
    obs.subscribe((complete: PosMeanings[]) => {
      cachedEntry.complete = complete;
    });
    return obs;
  }


}
