import {Component, OnInit} from '@angular/core';

import {WordCategoryService} from "../services/word-category.service";
import {BaseVocabularyService} from "../services/base-vocabulary.service";
import {BaseVocabulary} from "../models/base_vocabulary";
import {WordCategory} from "../models/word_category";

@Component({
  selector: 'base-vocabulary-main',
  templateUrl: './base-vocabulary.component.html',
  styleUrls: ['./base-vocabulary.component.css']
})
export class BaseVocabularyComponent implements OnInit {

  baseVocabulary: BaseVocabulary;
  showSamples = false;

  junior1 = {code: 'junior1', name: '初级'} as WordCategory;
  junior2 = {code: 'junior2', name: '基础'} as WordCategory;
  cet4 = {code: 'cet4', name: 'CET4'} as WordCategory;
  cet6 = {code: 'cet6', name: 'CET6'} as WordCategory;

  allCats = [this.junior1, this.junior2, this.cet4, this.cet6];

  selected: WordCategory;
  changed = false;

  constructor(private wordCategoryService: WordCategoryService,
              private baseVocabularyService: BaseVocabularyService) {
  }

  ngOnInit() {
    this.wordCategoryService.list()
      .subscribe((cats: WordCategory[]) => {
        if (cats) {
          for (let thisCat of this.allCats) {
            let cat = cats.find(c => c.code === thisCat.code);
            if (cat) {
              Object.assign(thisCat, cat);
            }
          }
        }
      });
    this.baseVocabularyService.get()
      .subscribe((bv: BaseVocabulary) => {
        if (!bv) {
          return;
        }
        this.baseVocabulary = bv;
        this.selected = this.allCats.find(cat => cat.code === bv.categoryCode);
      });
  }

  select(wordCategory) {
    this.selected = wordCategory;
    this.changed = !this.baseVocabulary || this.selected.code !== this.baseVocabulary.categoryCode;
  }

  save() {
    if (!this.selected) {
      return;
    }
    let baseVocabulary = new BaseVocabulary();
    baseVocabulary.categoryCode = this.selected.code;
    this.baseVocabularyService.reset(baseVocabulary)
      .subscribe(opr => {
        if (opr && opr.ok === 1) {
          this.baseVocabulary = baseVocabulary;
          this.changed = false;
        }
      });
  }
}
