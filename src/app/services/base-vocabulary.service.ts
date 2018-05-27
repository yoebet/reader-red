import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';

import {BaseVocabulary} from '../models/base-vocabulary';
import {OpResult} from '../models/op-result';
import {BaseService} from './base.service';

@Injectable()
export class BaseVocabularyService extends BaseService<BaseVocabulary> {

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_base_voca`;
  }

  get(): Observable<BaseVocabulary> {
    return super.list().map((bvs: BaseVocabulary[]) => {
      return bvs && bvs.length ? bvs[0] : null;
    }) as Observable<BaseVocabulary>;
  }

  reset(bv: BaseVocabulary): Observable<OpResult> {
    return this.http.post<OpResult>(this.baseUrl, bv, this.httpOptions).catch(this.handleError);
  }
}
