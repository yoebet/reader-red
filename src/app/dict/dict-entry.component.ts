import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { last, union } from 'lodash';

import { DictEntry } from '../models/dict-entry';
import { UserWord } from '../models/user-word';
import { Para } from '../models/para';
import { DictService } from '../services/dict.service';
import { UserWordService } from '../services/user-word.service';
import { ParaService } from '../services/para.service';
import { AnnotationSet } from '../anno/annotation-set';
import { AnnotationsService } from '../services/annotations.service';

@Component({
  selector: 'dict-entry',
  templateUrl: './dict-entry.component.html',
  styleUrls: ['./dict-entry.component.css']
})
export class DictEntryComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() entry: DictEntry;
  @Input() initialSelectedItemId: number;
  @Input() relatedWords: string[];
  @Input() context: any;
  @Output() viewReady = new EventEmitter();
  viewReadyEntry = null;

  refWords: string[];
  userWord: UserWord;
  wordSource: { isCurrentPara?: boolean, selectedPara?: Para, paras?: Para[] };

  entryStack = [];
  initialWord: string;
  selectedItemId: number;
  selectMeaningItem = true;
  textShowTrans = false;
  textShowTitle = false;
  textTabActive = false;

  highlightSentence = true;
  annotatedWordsHover = true;
  textMarkNewWords = true;
  textLookupDict = false;
  selectedPara: Para;

  // TODO:
  annotationSet = new AnnotationSet([]);


  constructor(private cdr: ChangeDetectorRef,
              private dictService: DictService,
              private vocaService: UserWordService,
              private paraService: ParaService,
              private annotationsService: AnnotationsService,) {
  }

  ngOnInit() {
    this.initialWord = this.entry.word;
    this.selectedItemId = this.initialSelectedItemId;
    this.loadParas();
    this.annotationsService.getDefaultAnnotationSet()
      .subscribe(annoSet => {
        if (annoSet) {
          this.annotationSet = annoSet;
        }
      });
  }

  ngAfterViewChecked() {
    if (this.viewReadyEntry === this.entry) {
      return;
    }
    this.viewReady.emit();
    this.viewReadyEntry = this.entry;
  }

  goto(word: string) {
    this.dictService.getEntry(word)
      .subscribe(e => {
          if (!e) {
            return;
          }
          this.entryStack.push(this.entry);
          this.entry = e;
          this.onEntryChanged();
        }
      );
  }

  goback() {
    if (this.entryStack.length > 0) {
      this.entry = this.entryStack.pop();
      this.onEntryChanged();
    }
  }

  loadCompleteMeanings() {
    let _id = this.entry._id;
    this.dictService.getCompleteMeanings(_id).subscribe(complete => {
      if (!complete) {
        return;
      }
      if (!this.entry || this.entry._id !== _id) {
        return;
      }
      this.entry.complete = complete;
    });
  }

  loadParas() {
    if (!this.wordSource) {
      this.wordSource = {};
    } else if (this.wordSource.paras) {
      return;
    }
    this.paraService.textSearch(this.entry.word).subscribe(paras => {
      if (this.wordSource) {
        this.wordSource.paras = paras;
      }
    });
  }

  selectPara(para): void {
    if (this.wordSource) {
      this.wordSource.selectedPara = para;
    }
  }

  textTabActivated() {
    this.setUserWordSource();
  }

  setUserWordSource() {
    if (this.wordSource) {
      return;
    }
    // if (!this.userWord || !this.userWord.paraId) {
    //   return;
    // }
    // if (this.context && this.context.paraId === this.userWord.paraId) {
    //   this.wordSource = { isCurrentPara: true };
    //   return;
    // }
    // this.paraService.loadPara(this.userWord.paraId)
    //   .subscribe((para: Para) => {
    //     this.wordSource = { para };
    //   });
    this.loadParas();
  }

  private onEntryChanged() {
    let entry = this.entry;
    this.refWords = null;
    let refWords = union<string>(entry.baseForm ? [entry.baseForm] : null, this.relatedWords);
    if (refWords.length > 0) {
      let previous = last(this.entryStack);
      if (previous) {
        refWords = refWords.filter(w => w !== previous);
      }
      if (refWords.length > 0) {
        this.refWords = refWords;
      }
    }
    if (entry.word === this.initialWord) {
      this.selectedItemId = this.initialSelectedItemId;
    } else {
      this.selectedItemId = null;
    }
    this.userWord = null;
    this.wordSource = null;
    this.vocaService.getOne(entry.word)
      .subscribe(userWord => {
        this.userWord = userWord;
        if (this.textTabActive) {
          this.setUserWordSource();
        }
      });
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entry) {
      if (this.selectMeaningItem) {
        this.entryStack = [];
      } else {
        let pre = changes.entry.previousValue;
        if (pre) {
          this.entryStack.push(pre);
        }
      }
      this.onEntryChanged();
    }
  }


}
