import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import {BaseService} from './base.service';
import {AnnotationFamily} from "../models/annotation-family";
import {AnnotationSet} from "../anno/annotation-set";

@Injectable()
export class AnnotationsService extends BaseService<AnnotationFamily> {

  annotationsMap: Map<string, AnnotationSet> = new Map<string, AnnotationSet>();

  constructor(protected http: HttpClient) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/annotation_families`;
  }

  getAnnotationSet(familyId: string): Observable<AnnotationSet> {
    let anns = this.annotationsMap.get(familyId);
    if (anns) {
      return Observable.of(anns);
    }

    return this.getDetail(familyId).map((family: AnnotationFamily) => {
      if (!family) {
        return null;
      }
      let groups = family.groups;
      let anns = new AnnotationSet(groups);
      this.annotationsMap.set(familyId, anns);
      return anns;
    });
  }

}
