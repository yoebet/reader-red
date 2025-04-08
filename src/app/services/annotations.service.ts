import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import { Observable, of as ObservableOf } from 'rxjs/';
import { map } from 'rxjs/operators';

import {BaseService} from './base.service';
import {AnnotationFamily} from '../models/annotation-family';
import {AnnotationSet} from '../anno/annotation-set';

@Injectable()
export class AnnotationsService extends BaseService<AnnotationFamily> {

  annotationsMap: Map<string, AnnotationSet> = new Map<string, AnnotationSet>();

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/anno_families`;
  }

  getAnnotationSet(familyId: string): Observable<AnnotationSet> {
    let anns = this.annotationsMap.get(familyId);
    if (anns) {
      return ObservableOf(anns);
    }

    return this.getDetail(familyId).pipe(map((family: AnnotationFamily) => {
      if (!family) {
        return null;
      }
      let groups = family.groups;
      let anns2 = new AnnotationSet(groups);
      this.annotationsMap.set(familyId, anns2);
      return anns2;
    }));
  }

}
