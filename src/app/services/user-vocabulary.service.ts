import {Injectable} from "@angular/core";

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/combineLatest';
import {groupBy} from 'lodash';

import {UserWordService} from "./user-word.service";
import {WordCategoryService} from "./word-category.service";
import {UserPreferenceService} from "./user-preference.service";
import {WordCategory} from "../models/word-category";

import {UserWord} from "../models/user-word";
import {CombinedWordsMap} from "../en/combined-words-map";
import {DictService} from "./dict.service";

@Injectable()
export class UserVocabularyService {

  private baseVocabularyCategory: WordCategory;

  private baseVocabularyMap: Map<string, string>;
  private combinedWordsMap: CombinedWordsMap;
  private combinedWordsMap$: Observable<CombinedWordsMap>;


  constructor(private preferenceService: UserPreferenceService,
              private userWordService: UserWordService,
              private wordCategoryService: WordCategoryService,
              private dictService: DictService) {

    preferenceService.onBaseVocabularyChanged
      .subscribe(code => {
        if (this.baseVocabularyCategory
          && code === this.baseVocabularyCategory.code) {
          return;
        }
        this.wordCategoryService.getCategory(code)
          .subscribe((cat: WordCategory) => {
            this.baseVocabularyCategory = cat;
            this.invalidateBaseVocabularyMap();
          });
      });
  }

  invalidateBaseVocabularyMap() {
    this.baseVocabularyMap = null;
    this.combinedWordsMap = null;
    this.combinedWordsMap$ = null;
  }

  getBaseVocabularyMap(): Observable<Map<string, string>> {
    if (this.baseVocabularyMap) {
      return Observable.of(this.baseVocabularyMap);
    }

    let bvm = this.baseVocabularyMap = new Map();

    return Observable.create(observer => {
      this.preferenceService.getBaseVocabulary()
        .subscribe((code) => {
          if (!code) {
            observer.next(bvm);
            observer.complete();
            return;
          }
          this.wordCategoryService.getCategory(code)
            .subscribe((cat: WordCategory) => {
              if (!cat) {
                observer.next(bvm);
                observer.complete();
                return;
              }

              this.baseVocabularyCategory = cat;

              let codes = [];
              while (cat) {
                codes.push(cat.code);
                if (cat.extend) {
                  cat = cat.extend;
                } else {
                  break;
                }
              }

              let codesLen = codes.length;

              for (let code of codes) {
                this.wordCategoryService.loadAllWords(code)
                  .subscribe((words: string[]) => {
                    if (words) {
                      for (let word of words) {
                        if (word.indexOf(' ') === -1) {
                          bvm.set(word, code);
                        }
                      }
                    }
                    codesLen--;
                    if (codesLen === 0) {
                      observer.next(bvm);
                      observer.complete();

                      if (this.combinedWordsMap) {
                        this.combinedWordsMap.baseVocabularyMap = bvm;
                      }
                    }
                  });
              }
            });
        });
    });
  }


  inBaseVocabulary(word: string): Observable<string> {
    if (this.baseVocabularyMap) {
      return Observable.of(this.baseVocabularyMap.get(word));
    }
    return this.getBaseVocabularyMap()
      .map((map: Map<string, string>) => {
        if (!map) {
          return null;
        }
        return map.get(word);
      });
  }

  getCombinedWordsMap(): Observable<CombinedWordsMap> {
    if (this.combinedWordsMap) {
      return Observable.of(this.combinedWordsMap);
    }
    if (this.combinedWordsMap$) {
      return this.combinedWordsMap$;
    }

    let obs = Observable.combineLatest(
      this.getBaseVocabularyMap(),
      this.userWordService.getUserWordsMap(),
      this.dictService.loadBaseForms()
    ).map(([baseVocabularyMap, userWordsMap, baseFormsMap]) => {
      if (!baseVocabularyMap || !userWordsMap || !baseFormsMap) {
        return null;
      }
      let cwm = new CombinedWordsMap(
        baseVocabularyMap as Map<string, string>,
        userWordsMap as Map<string, UserWord>,
        baseFormsMap as Map<string, string>);
      this.combinedWordsMap = cwm;
      this.combinedWordsMap$ = null;
      return cwm;
    });
    obs = obs.share();
    this.combinedWordsMap$ = obs;
    return obs
  }

  statistic(): Observable<Object> {
    return Observable.create(observer => {
      Observable.combineLatest(
        this.getBaseVocabularyMap(),
        this.userWordService.list())
        .subscribe(([baseVocabularyMap, userWords]) => {
          let bvm = baseVocabularyMap as Map<string, string>;
          let uws = userWords as UserWord[];

          uws = uws.filter(uw => uw.word.indexOf(' ') === -1);


          let uwsByFamiliarity = groupBy<UserWord>(uws, 'familiarity');

          let $word = (uw: UserWord) => uw.word;
          let wordsFamiliarity1: string[] = uwsByFamiliarity['1'].map($word);
          let wordsFamiliarity2: string[] = uwsByFamiliarity['2'].map($word);
          let wordsFamiliarity3: string[] = uwsByFamiliarity['3'].map($word);

          let unfamiliarCountInBV = 0;

          for (let word of wordsFamiliarity1.concat(wordsFamiliarity2)) {
            if (bvm.get(word)) {
              unfamiliarCountInBV++;
            }
          }

          let familiarCountNotInBV = 0;
          for (let word of wordsFamiliarity3) {
            if (!bvm.get(word)) {
              familiarCountNotInBV++;
            }
          }

          let baseVocabularyCount = bvm.size;
          let userWordsCount = uws.length;

          let graspedCount = baseVocabularyCount - unfamiliarCountInBV + familiarCountNotInBV;

          let vocabularyStatistic = {
            baseVocabularyCount,
            userWordsCount,
            familiarity1Count: wordsFamiliarity1.length,
            familiarity2Count: wordsFamiliarity2.length,
            familiarity3Count: wordsFamiliarity3.length,
            unfamiliarCountInBV,
            familiarCountNotInBV,
            graspedCount
          };

          observer.next(vocabularyStatistic);
          observer.complete();
        });

    });
  }

}
