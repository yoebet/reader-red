import {
  Component, Input, OnInit, OnChanges,
  SimpleChanges, ChangeDetectorRef
} from '@angular/core';
import {union, last} from 'lodash';

import {DictEntry, TagLabelMap} from '../models/dict-entry';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'dict-entry',
  templateUrl: './dict-entry.component.html',
  styleUrls: ['./dict-entry.component.css']
})
export class DictEntryComponent implements OnInit, OnChanges {
  @Input() entry: DictEntry;
  @Input() initialSelectedItemId: number;
  @Input() relatedWords: string[];
  cdr: ChangeDetectorRef;
  dictService: DictService;
  categoryTags: string[];
  refWords: string[];

  entryStack = [];
  initialWord: string;
  selectedItemId: number;
  selectMeaningItem = false;

  constructor(cdr: ChangeDetectorRef, dictService: DictService) {
    this.cdr = cdr;
    this.dictService = dictService;
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


  get tagLabelMap() {
    return TagLabelMap;
  }

}
