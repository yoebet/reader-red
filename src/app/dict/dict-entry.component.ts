import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
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
import { AnnotationsService } from '../services/annotations.service';
import { PopupDictSupportComponent } from './popup-dict-support.component';
import { UserVocabularyService } from '../services/user-vocabulary.service';
import { SelectedItem, UserWordChange } from '../content-types/dict-request';
import { DictZhService } from '../services/dict-zh.service';

@Component({
  selector: 'dict-entry',
  templateUrl: './dict-entry.component.html',
  styleUrls: ['./dict-entry.component.css']
})
export class DictEntryComponent extends PopupDictSupportComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() entry: DictEntry;
  @Input() relatedWords: string[];
  @Input() initialSelectedItem: SelectedItem;
  @Input() context: any;

  @Output() viewReady = new EventEmitter();
  @Output() userWordChanged = new EventEmitter<UserWordChange>();
  @Output() dictItemSelected = new EventEmitter<SelectedItem>();

  showTrans = false;
  leftRight = false;
  lookupDict = true;

  viewReadyEntry = null;

  refWords: string[];
  userWord: UserWord;
  wordSource: { selectedPara?: Para, paras?: Para[] };

  entryStack = [];
  initialWord: string;
  selectedItem: SelectedItem;

  textShowTitle = false;
  textTabActive = false;

  constructor(private cdr: ChangeDetectorRef,
              private dictService: DictService,
              private vocaService: UserWordService,
              private paraService: ParaService,
              protected annotationsService: AnnotationsService,
              protected vocabularyService: UserVocabularyService,
              protected dictZhService: DictZhService,
              protected resolver: ComponentFactoryResolver) {
    super(annotationsService, vocabularyService, dictZhService, resolver);
  }

  ngOnInit() {
    super.ngOnInit();
    this.initialWord = this.entry.word;
    let isi = this.initialSelectedItem;
    if (isi) {
      this.selectedItem = { pos: isi.pos, meaning: isi.meaning };
    } else {
      this.selectedItem = null;
    }
    this.loadParas();
  }

  ngAfterViewChecked() {
    if (this.viewReadyEntry === this.entry) {
      return;
    }
    this.viewReady.emit();
    this.viewReadyEntry = this.entry;
  }

  protected resetRefWords() {
    this.refWords = null;
    let entry = this.entry;
    let refWords = union(entry.baseForm ? [entry.baseForm] : null, this.relatedWords);
    if (refWords.length > 0) {
      let previous = last(this.entryStack);
      if (previous) {
        refWords = refWords.filter(w => w !== previous);
      }
      if (refWords.length > 0) {
        this.refWords = refWords;
      }
    }
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

  selectPara(para: Para): void {
    const wordSource = this.wordSource;
    if (!wordSource) {
      return;
    }
    const bookChanged = !wordSource.selectedPara || wordSource.selectedPara.book !== para.book;
    wordSource.selectedPara = para;
    if (bookChanged) {
      this.onBookChanged(para.book);
    }
  }

  textTabActivated() {
    this.setUserWordSource();
  }

  setUserWordSource() {
    if (this.wordSource) {
      return;
    }
    this.loadParas();
  }

  onEntryChanged() {
    let entry = this.entry;
    this.resetRefWords();
    if (entry.word === this.initialWord) {
      let isi = this.initialSelectedItem;
      if (isi) {
        this.selectedItem = { pos: isi.pos, meaning: isi.meaning };
      } else {
        this.selectedItem = null;
      }
    } else {
      this.selectedItem = null;
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
      this.entryStack = [];
      let pre = changes.entry.previousValue;
      if (pre) {
        this.entryStack.push(pre);
      }
    }
    this.onEntryChanged();
  }


}
