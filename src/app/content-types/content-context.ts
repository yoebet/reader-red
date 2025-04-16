import {Observable} from 'rxjs/';

import {AnnotationSet} from '../anno/annotation-set';
import {ZhPhrases} from '../anno/zh-phrases';
import {CombinedWordsMap} from '../en/combined-words-map';
import { LangCode } from '../models/book';

export class ContentContext {
  contentLang: LangCode;
  transLang: LangCode;
  annotationSet: AnnotationSet;
  zhPhrases: ZhPhrases;
  combinedWordsMapObs: Observable<CombinedWordsMap>;
}
