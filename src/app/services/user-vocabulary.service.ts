import {Injectable} from "@angular/core";

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import {groupBy} from 'lodash';

import {UserWordService} from "./user-word.service";
import {WordCategoryService} from "./word-category.service";
import {UserPreferenceService} from "./user-preference.service";
import {WordCategory} from "../models/word-category";

import {UserWord} from "../models/user-word";

@Injectable()
export class UserVocabularyService {

  private baseVocabularyMap: Map<string, string>;
  private baseVocabularyCategory: WordCategory;

  categoriesCodes: string[];

  constructor(private preferenceService: UserPreferenceService,
              private userWordService: UserWordService,
              private wordCategoryService: WordCategoryService) {

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
    this.categoriesCodes = null;
  }

  getBaseVocabularyMap(): Observable<Map<string, string>> {
    if (this.baseVocabularyMap) {
      return Observable.of(this.baseVocabularyMap);
    }

    let bvm = this.baseVocabularyMap = new Map();
    this.categoriesCodes = [];

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

              this.categoriesCodes = codes;

              let codesLen = codes.length;

              for (let code of codes) {
                this.wordCategoryService.loadAllWords(code)
                  .subscribe((words: string[]) => {
                    if (words) {
                      for (let word of words) {
                        bvm.set(word, code);
                      }
                    }
                    codesLen--;
                    if (codesLen === 0) {
                      observer.next(bvm);
                      observer.complete();
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

  statistic(): Observable<Object> {
    return Observable.create(observer => {
      Observable.combineLatest(
        this.getBaseVocabularyMap(),
        this.userWordService.list())
        .subscribe(([baseVocabularyMap, userWords]) => {
          let bvm = baseVocabularyMap as Map<string, string>;
          let uws = userWords as UserWord[];

          let baseVocabularyCount = bvm.size;
          let userWordsCount = uws.length;

          let uwsByFamiliarity = groupBy<UserWord>(uws, 'familiarity');
          let uwsFamiliarity1: UserWord[] = uwsByFamiliarity['1'];
          let uwsFamiliarity2: UserWord[] = uwsByFamiliarity['2'];
          let uwsFamiliarity3: UserWord[] = uwsByFamiliarity['3'];

          let wordsFamiliarity1: string[] = [];
          let wordsFamiliarity2: string[] = [];
          let wordsFamiliarity3: string[] = [];
          if (uwsFamiliarity1) {
            wordsFamiliarity1 = uwsFamiliarity1.map(uw => uw.word) as string[];
          }
          if (uwsFamiliarity2) {
            wordsFamiliarity2 = uwsFamiliarity2.map(uw => uw.word) as string[];
          }
          if (uwsFamiliarity3) {
            wordsFamiliarity3 = uwsFamiliarity3.map(uw => uw.word) as string[];
          }

          let familiarity1Count = wordsFamiliarity1.length;
          let familiarity2Count = wordsFamiliarity2.length;
          let familiarity3Count = wordsFamiliarity3.length;

          let unfamiliarCountInBV = 0;

          for (let word of wordsFamiliarity1) {
            if (bvm.get(word)) {
              unfamiliarCountInBV++;
            }
          }
          for (let word of wordsFamiliarity2) {
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

          let graspedCount = baseVocabularyCount;
          graspedCount -= unfamiliarCountInBV;
          graspedCount += familiarCountNotInBV;

          let vocabularyStatistic = {
            baseVocabularyCount,
            userWordsCount,
            familiarity1Count,
            familiarity2Count,
            familiarity3Count,
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
