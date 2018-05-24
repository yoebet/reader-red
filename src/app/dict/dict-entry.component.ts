import {
  Component, Input, Output, OnInit, EventEmitter, OnChanges,
  SimpleChanges, ChangeDetectorRef, AfterViewChecked
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {union, last} from 'lodash';

import {DictEntry, TagLabelMap} from '../models/dict-entry';
import {UserWord} from '../models/user-word';
import {Para} from '../models/para';
import {OpResult} from '../models/op-result';
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
  @Output() onUserWordRemoved = new EventEmitter<UserWord>();
  @Output() viewReady = new EventEmitter();
  viewReadyEntry = null;

  categoryTags: string[];
  refWords: string[];
  userWord: UserWord;
  userWordSource: any;

  entryStack = [];
  initialWord: string;
  selectedItemId: number;
  selectMeaningItem = true;
  textTrans = false;
  textTabActive = false;

  static sentenceTagName = 's-st';
  static highlightSentenceClass = 'highlight';
  static highlightWordClass = 'highlight-word';

  constructor(private cdr: ChangeDetectorRef,
              private dictService: DictService,
              private vocaService: VocabularyService,
              private paraService: ParaService,
              private sanitizer: DomSanitizer) {
  }

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


  private commonPrefix(strings: string[]): string {
    let first = strings[0];
    let commonLength = first.length;
    for (let i = 1; i < strings.length; ++i) {
      for (let j = 0; j < commonLength; ++j) {
        if (strings[i].charAt(j) !== first.charAt(j)) {
          commonLength = j;
          break;
        }
      }
    }
    return first.slice(0, commonLength);
  }

  highlightTheWord(para) {
    let entry = this.entry;
    let words = [entry.word];
    if (entry.baseForms) {
      words = words.concat(entry.baseForms);
    }
    if (entry.forms) {
      words = words.concat(entry.forms);
    }

    let content = para.content;

    let contentHolder = document.createElement('div');
    contentHolder.innerHTML = content;

    let textContent = contentHolder.textContent;
    words = words.filter(word => textContent.indexOf(word) >= 0);
    let patterns = words.map(word => new RegExp(`\\b${word}\\b`));
    let commonPrefixPattern = null;
    if (words.length > 1) {
      let cp = this.commonPrefix(words);
      if (cp.length >= 3) {
        commonPrefixPattern = new RegExp(`\\b${cp}`);
      }
    }

    let nodeIterator = document.createNodeIterator(
      contentHolder,
      NodeFilter.SHOW_TEXT
    );
    let textNode;
    let nodesToTry: any[] = [];

    while (textNode = nodeIterator.nextNode()) {
      let text = textNode.nodeValue;
      let element = textNode.parentNode;
      let parentWholeText = element.textContent;
      if (text.trim().length < 3) {
        continue;
      }
      if (commonPrefixPattern && !commonPrefixPattern.test(text)) {
        continue;
      }
      for (let pattern of patterns) {
        let matcher = text.match(pattern);
        if (!matcher) {
          continue;
        }
        let word = matcher[0];
        if (word === parentWholeText) {
          element.classList.add(DictEntryComponent.highlightWordClass);
          break;
        }
        nodesToTry.push(textNode);
      }
    }

    for (let pattern of patterns) {
      let nodes = nodesToTry;
      nodesToTry = [];
      for (let textNode of nodes) {
        let text = textNode.nodeValue;
        let element = textNode.parentNode;
        let matcher = text.match(pattern);
        if (!matcher) {
          nodesToTry.push(textNode);
          continue;
        }
        while (matcher) {
          let word = matcher[0];
          let offset = matcher['index'];
          let wordNode = textNode;
          if (offset > 0) {
            if (offset > 2) {
              nodesToTry.push(wordNode);
            }
            wordNode = wordNode.splitText(offset);
          }
          if (offset + word.length < text.length) {
            textNode = wordNode.splitText(word.length);
          }

          let wrapping = document.createElement('span');
          wrapping.classList.add(DictEntryComponent.highlightWordClass);
          element.replaceChild(wrapping, wordNode);
          wrapping.appendChild(wordNode);

          if (offset + word.length >= text.length) {
            break;
          }
          text = textNode.nodeValue;
          if (text.length < 3) {
            break;
          }
          matcher = text.match(pattern);
          if (!matcher) {
            nodesToTry.push(textNode);
          }
        }
      }
    }

    let findSentence = (el): any => {
      do {
        if (el === contentHolder) {
          return null;
        }
        if (el.matches(DictEntryComponent.sentenceTagName)) {
          return el;
        }
        el = el.parentNode;
      } while (el);
      return null;
    };

    let sids = [];

    let wordEls = Array.from(contentHolder.querySelectorAll('.' + DictEntryComponent.highlightWordClass));
    for (let wordEl of wordEls) {
      let sentenceEl = findSentence(wordEl);
      if (sentenceEl) {
        let sid = sentenceEl.dataset.sid;
        if (sids.indexOf(sid) >= 0) {
          continue;
        }
        sentenceEl.classList.add(DictEntryComponent.highlightSentenceClass);
        sids.push(sid);
      }
    }

    content = contentHolder.innerHTML;

    let trans = para.trans;
    if (sids.length > 0) {
      contentHolder.innerHTML = trans;
      let transEls = contentHolder.querySelectorAll(DictEntryComponent.sentenceTagName);
      let tes = Array.from(transEls);
      for (let transEl of tes) {
        let te = transEl as any;
        let sid = te.dataset.sid;
        if (sids.indexOf(sid) >= 0) {
          te.classList.add(DictEntryComponent.highlightSentenceClass);
        }
      }
      trans = contentHolder.innerHTML;
    }

    return {content, trans};
  }

  loadMoreParas() {
    if (!this.userWordSource) {
      this.userWordSource = {};
    } else if (this.userWordSource.moreParas) {
      return;
    }
    this.paraService.textSearch(this.entry.word)
      .subscribe(paras => {
        let moreParas = [];
        let sourcePara = this.userWordSource.para;
        for (let para of paras) {
          if (sourcePara && para._id === sourcePara._id) {
            continue;
          }
          let {content, trans} = this.highlightTheWord(para);
          let sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(content);
          let sanitizedTrans = this.sanitizer.bypassSecurityTrustHtml(trans);
          let paraText = {
            para,
            book: para.book,
            chap: para.chap,
            sanitizedContent,
            sanitizedTrans
          };
          moreParas.push(paraText);
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
        let uws: any = {};
        uws.para = para;
        uws.chap = para.chap;
        uws.book = para.book;

        let {content, trans} = this.highlightTheWord(para);
        uws.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(content);
        uws.sanitizedTrans = this.sanitizer.bypassSecurityTrustHtml(trans);
        this.userWordSource = uws;
      });
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
