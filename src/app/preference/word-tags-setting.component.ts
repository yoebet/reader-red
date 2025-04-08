import {Component, OnInit} from '@angular/core';
import {isEqual, sortBy} from 'lodash';

import {WordCategoryService} from '../services/word-category.service';
import {UserPreferenceService} from '../services/user-preference.service';
import {WordCategory} from '../models/word-category';
import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'word-tags-setting',
  templateUrl: './word-tags-setting.component.html',
  styleUrls: ['./word-tags-setting.component.css']
})
export class WordTagsSettingComponent implements OnInit {

  wordCategories: WordCategory[];
  wordCategoriesMap: Map<string, WordCategory>;
  saved: string[];
  selected: string[];
  selectedMap: Map<string, boolean> = new Map();

  groups: any[];
  changed = false;

  sampleWords = ['help', 'summon', 'waiter', 'prosperity', 'obsess', 'pottery', 'offish'];
  sampleWordEntries: DictEntry[];
  showSamples = false;

  constructor(private wordCategoryService: WordCategoryService,
              private userPreferenceService: UserPreferenceService,
              private dictService: DictService) {
  }

  ngOnInit() {
    this.wordCategoryService.list()
      .subscribe((cats: WordCategory[]) => {
        this.wordCategories = cats;
        this.wordCategoriesMap = this.wordCategoryService.wordCategoriesMap;

        let group1 = {
          title: '普通',
          codes: [/*'junior1', 'junior2', */'basic', 'cet4', 'cet6', 'cet'],
          categories: null as WordCategory[]
        };
        let group2 = {
          title: '高级',
          codes: ['gre', 'ielts', 'pro'],
          categories: null as WordCategory[]
        };
        let group3 = {
          title: '词频',
          codes: ['coca', 'bnc', 'anc', 'haici'],
          categories: null as WordCategory[]
        };

        let groups = [group1, group2, group3];
        for (let group of groups) {
          group.codes = this.sortCodes(group.codes);
          group.categories = group.codes
            .map(code => this.wordCategoriesMap.get(code))
            .filter(cat => cat);
        }
        this.groups = groups;
      });
    this.userPreferenceService.getWordTags()
      .subscribe((codes: string[]) => {
        if (!codes) {
          this.saved = [];
          return;
        }
        this.saved = codes;
        this.selected = codes;
        for (let code of codes) {
          this.selectedMap.set(code, true);
        }
      });

  }

  private sortCodes(codes: string[]) {
    return sortBy<string>(codes, (code: string) => {
      let category = this.wordCategoriesMap.get(code);
      return category.no;
    });
  }

  clickCategory(code) {
    let last = this.selectedMap.get(code);
    let now = !last;
    this.selectedMap.set(code, now);
    if (now) {
      if (code === 'basic') {
        this.selectedMap.set('junior1', false);
        this.selectedMap.set('junior2', false);
      } else if (code === 'junior1' || code === 'junior2') {
        this.selectedMap.set('basic', false);
      } else if (code === 'cet') {
        this.selectedMap.set('cet4', false);
        this.selectedMap.set('cet6', false);
      } else if (code === 'cet4' || code === 'cet6') {
        this.selectedMap.set('cet', false);
      }
    }

    this.selected = [];
    this.selectedMap.forEach((value, key) => {
      if (value) {
        this.selected.push(key);
      }
    });
    this.selected = this.sortCodes(this.selected);
    this.changed = !isEqual(this.selected, this.saved);
  }

  save() {
    this.userPreferenceService.setWordTags(this.selected).subscribe(opr => {
      if (opr && opr.ok === 1) {
        this.saved = this.selected;
        this.changed = false;
      }
    });
  }

  processSamples() {
    if (this.showSamples && !this.sampleWordEntries) {
      this.sampleWordEntries = [];
      for (let word of this.sampleWords) {
        this.dictService.getEntry(word)
          .subscribe((entry: DictEntry) => {
            if (entry) {
              this.sampleWordEntries.push(entry);
            }
          });
      }
    }
  }


}
