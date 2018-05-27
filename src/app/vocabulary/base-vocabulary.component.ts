import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnInit, ViewChild,
  ViewContainerRef
} from '@angular/core';

import Drop from 'tether-drop'

import {WordCategoryService} from "../services/word-category.service";
import {BaseVocabularyService} from "../services/base-vocabulary.service";
import {BaseVocabulary} from "../models/base_vocabulary";
import {WordCategory} from "../models/word_category";
import {WordMeaningsComponent} from "./word-meanings.component";

@Component({
  selector: 'base-vocabulary-main',
  templateUrl: './base-vocabulary.component.html',
  styleUrls: ['./base-vocabulary.component.css']
})
export class BaseVocabularyComponent implements OnInit {
  @ViewChild('wordMeanings', {read: ViewContainerRef}) wordMeanings: ViewContainerRef;

  baseVocabulary: BaseVocabulary;
  showSamples = false;
  sampleWords: string[];

  junior1 = {code: 'junior1', name: '初级'} as WordCategory;
  junior2 = {code: 'junior2', name: '基础'} as WordCategory;
  cet4 = {code: 'cet4', name: 'CET4'} as WordCategory;
  cet6 = {code: 'cet6', name: 'CET6'} as WordCategory;
  gre = {code: 'gre', name: 'GRE'} as WordCategory;
  yasi = {code: 'yasi', name: '雅思'} as WordCategory;
  pro = {code: 'pro', name: '专英'} as WordCategory;

  allCats = [this.junior1, this.junior2, this.cet4, this.cet6, this.gre, this.yasi, this.pro];

  selected: WordCategory;
  changed = false;
  wordMeaningsComponentRef: ComponentRef<WordMeaningsComponent>;
  wordDrops = new Map<string, Drop>();


  constructor(private wordCategoryService: WordCategoryService,
              private baseVocabularyService: BaseVocabularyService,
              private resolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
    this.wordCategoryService.list()
      .subscribe((cats: WordCategory[]) => {
        if (!cats) {
          return;
        }
        let catsMap = new Map();
        for (let cat of cats) {
          catsMap.set(cat.code, cat);
        }
        for (let thisCat of this.allCats) {
          let cat = catsMap.get(thisCat.code);
          if (cat) {
            Object.assign(thisCat, cat);
            if (thisCat.extendTo) {
              thisCat.extend = catsMap.get(thisCat.extendTo);
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
    this.processSamples();
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

  private clearWordDrops() {
    this.wordDrops.forEach((drop: Drop) => {
      drop.destroy();
    });
    this.wordDrops.clear();
  }

  processSamples() {
    if (this.showSamples) {
      this.wordCategoryService.fetchSampleWords(this.selected.code).subscribe(words => {
        this.sampleWords = words ? words : [];
        this.clearWordDrops();
      });
    } else {
      this.sampleWords = null;
      this.clearWordDrops();
    }
  }


  onClickAWord(word, $event) {
    let drop = this.wordDrops.get(word);
    if (drop) {
      return;
    }
    if (!this.wordMeaningsComponentRef) {
      let factory: ComponentFactory<WordMeaningsComponent> = this.resolver.resolveComponentFactory(WordMeaningsComponent);
      this.wordMeanings.clear();
      this.wordMeaningsComponentRef = this.wordMeanings.createComponent(factory);
    }
    let wmcr = this.wordMeaningsComponentRef;

    let content = function () {
      wmcr.instance.word = word;
      return wmcr.location.nativeElement;
    };

    drop = new Drop({
      target: $event.target,
      content: content,
      classes: `drop-word`,
      position: 'bottom center',
      constrainToScrollParent: false,
      remove: true,
      hoverOpenDelay: 100,
      openOn: 'click'//click,hover,always
    });
    drop.open();
    this.wordDrops.set(word, drop);
  }
}
