import {
  Component, Input, Output, OnInit, EventEmitter, OnChanges,
  SimpleChanges, ChangeDetectorRef, AfterViewChecked
} from '@angular/core';
import {union, last} from 'lodash';

import {DictEntry, TagLabelMap} from '../models/dict-entry';
import {UserWord} from '../models/user-word';
import {Para} from '../models/para';
import {DictService} from '../services/dict.service';
import {VocabularyService} from '../services/vocabulary.service';
import {ParaService} from '../services/para.service';

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
  userWordSource: { isCurrentPara?: boolean, para?: Para, moreParas?: Para[] };

  entryStack = [];
  initialWord: string;
  selectedItemId: number;
  selectMeaningItem = true;
  textTrans = false;
  textShowTitle = false;
  textTabActive = false;

  static sentenceTagName = 's-st';
  static highlightSentenceClass = 'highlight';
  static highlightWordClass = 'highlight-word';

  constructor(private cdr: ChangeDetectorRef,
              private dictService: DictService,
              private vocaService: VocabularyService,
              private paraService: ParaService) {
  }


  /*get tagLabelMap() {
    return TagLabelMap;
  }*/

  ngOnInit() {
    this.initialWord = this.entry.word;
    this.selectedItemId = this.initialSelectedItemId;
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
    })
  }

  loadMoreParas() {
    if (!this.userWordSource) {
      this.userWordSource = {};
    } else if (this.userWordSource.moreParas) {
      return;
    }
    this.paraService.textSearch(this.entry.word)
      .subscribe(paras => {
        let moreParas = paras;
        let sourcePara = this.userWordSource.para;
        if (sourcePara) {
          moreParas = moreParas.filter(p => p._id !== sourcePara._id);
        }
        this.userWordSource.moreParas = moreParas;
      });
  }

  textTabActivated() {
    this.setUserWordSource();
  }

  setUserWordSource() {
    if (this.userWordSource) {
      return;
    }
    if (!this.userWord || !this.userWord.paraId) {
      return;
    }
    if (this.context && this.context.paraId === this.userWord.paraId) {
      this.userWordSource = {isCurrentPara: true};
      return;
    }
    this.paraService.loadPara(this.userWord.paraId)
      .subscribe((para: Para) => {
        this.userWordSource = {para};
      });
  }

  private onEntryChanged() {
    let entry = this.entry;
    this.refWords = null;
    let refWords = union(entry.baseForms, this.relatedWords);
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
    this.userWordSource = null;
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
