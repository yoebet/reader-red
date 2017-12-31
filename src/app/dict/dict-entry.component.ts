import {
  Component, Input, Output, OnInit, EventEmitter, OnChanges,
  SimpleChanges, ChangeDetectorRef
} from '@angular/core';
import {union, last} from 'lodash';

import {DictEntry, TagLabelMap} from '../models/dict-entry';
import {UserWord} from '../models/user_word';
import {OpResult} from '../models/op-result';
import {DictService} from '../services/dict.service';
import {VocabularyService} from '../services/vocabulary.service';

@Component({
  selector: 'dict-entry',
  templateUrl: './dict-entry.component.html',
  styleUrls: ['./dict-entry.component.css']
})
export class DictEntryComponent implements OnInit, OnChanges {
  @Input() entry: DictEntry;
  @Input() initialSelectedItemId: number;
  @Input() relatedWords: string[];
  @Input() context: any;
  @Output() onUserWordRemoved = new EventEmitter<UserWord>();

  cdr: ChangeDetectorRef;
  dictService: DictService;
  vocaService: VocabularyService;
  categoryTags: string[];
  refWords: string[];
  userWord: UserWord;

  entryStack = [];
  initialWord: string;
  selectedItemId: number;
  selectMeaningItem = true;

  constructor(cdr: ChangeDetectorRef, dictService: DictService, vocaService: VocabularyService) {
    this.cdr = cdr;
    this.dictService = dictService;
    this.vocaService = vocaService;
  }

  ngOnInit() {
    this.initialWord = this.entry.word;
    this.selectedItemId = this.initialSelectedItemId;
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

  private onEntryChanged() {
    let entry = this.entry;
    this.categoryTags = DictEntry.EvaluateCategoryTags(entry.categories);
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
    this.vocaService.getOne(entry.word)
      .subscribe(userWord => this.userWord = userWord);
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

  addToVocabulary() {
    let uw = new UserWord();
    uw.word = this.entry.word;
    if (this.context) {
      uw.bookId = this.context.bookId;
      uw.chapId = this.context.chapId;
      uw.paraId = this.context.paraId;
    }
    this.vocaService.create(uw)
      .subscribe(_ => this.userWord = uw);
  }

  familiarityUp() {
    if (this.userWord.familiarity < 3) {
      this.userWord.familiarity++;
      this.vocaService.update(this.userWord)
        .subscribe(() => {
        });
    }
  }

  familiarityDown() {
    if (this.userWord.familiarity > 1) {
      this.userWord.familiarity--;
      this.vocaService.update(this.userWord)
        .subscribe(() => {
        });
    }
  }

  removeUserWord() {
    if (!confirm('确定要移除吗？')) {
      return;
    }
    this.vocaService.remove(this.userWord.word).subscribe((opr: OpResult) => {
      if (opr.ok === 1) {
        this.onUserWordRemoved.emit(this.userWord);
        this.userWord = null;
      }
    });
  }


  get tagLabelMap() {
    return TagLabelMap;
  }

}
