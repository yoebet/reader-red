import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnInit, ViewChild,
  ViewContainerRef
} from '@angular/core';

import * as Drop from 'tether-drop';

import {WordCategoryService} from '../services/word-category.service';
import {UserPreferenceService} from '../services/user-preference.service';
import {WordCategory} from '../models/word-category';
import {SimpleMeaningsComponent} from '../dict/simple-meanings.component';

@Component({
  selector: 'base-vocabulary',
  templateUrl: './base-vocabulary.component.html',
  styleUrls: ['./base-vocabulary.component.css']
})
export class BaseVocabularyComponent implements OnInit {
  @ViewChild('wordMeanings', {read: ViewContainerRef}) wordMeanings: ViewContainerRef;

  baseVocabulary: string;
  showSamples = false;
  sampleWords: string[];
  gypCollapse = false;

  // junior1 = {code: 'junior1'} as WordCategory;
  // junior2 = {code: 'junior2'} as WordCategory;
  basic = {code: 'basic'} as WordCategory;
  cet4 = {code: 'cet4'} as WordCategory;
  cet6 = {code: 'cet6'} as WordCategory;
  gre = {code: 'gre'} as WordCategory;
  ielts = {code: 'ielts'} as WordCategory;
  // pro = {code: 'pro'} as WordCategory;

  allCats = [this.basic, this.cet4, this.cet6, this.gre, this.ielts/*, this.pro*/];

  selected: WordCategory;
  changed = false;
  wordMeaningsComponentRef: ComponentRef<SimpleMeaningsComponent>;
  wordDrops = new Map<string, Drop>();


  constructor(private wordCategoryService: WordCategoryService,
              private userPreferenceService: UserPreferenceService,
              private resolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
    this.wordCategoryService.getCategoriesMap()
      .subscribe((catsMap: Map<string, WordCategory>) => {
        if (!catsMap) {
          return;
        }
        for (let thisCat of this.allCats) {
          let cat = catsMap.get(thisCat.code);
          if (cat) {
            Object.assign(thisCat, cat);
          }
        }
      });
    this.userPreferenceService.getBaseVocabulary()
      .subscribe((bv: string) => {
        if (!bv) {
          return;
        }
        this.baseVocabulary = bv;
        this.selected = this.allCats.find(cat => cat.code === bv);
      });
  }

  select(wordCategory) {
    this.selected = wordCategory;
    this.changed = !this.baseVocabulary || this.selected.code !== this.baseVocabulary;
    this.processSamples();
  }

  save() {
    if (!this.selected) {
      return;
    }
    let baseVocabulary = this.selected.code;
    this.userPreferenceService.setBaseVocabulary(baseVocabulary)
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
      let factory: ComponentFactory<SimpleMeaningsComponent> = this.resolver.resolveComponentFactory(SimpleMeaningsComponent);
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
