import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

import * as Drop from 'tether-drop';

import { Annotator } from '../anno/annotator';
import { AnnotatorHelper } from '../anno/annotator-helper';
import { AnnotationSet } from '../anno/annotation-set';
import { CombinedWordsMap } from '../en/combined-words-map';

import { DataAttrNames, DataAttrValues, UIConstants } from '../config';
import { Annotation } from '../models/annotation';
import { Book, LangCode } from '../models/book';
import { UserWord } from '../models/user-word';

import { DictService } from '../services/dict.service';
import { DictZhService } from '../services/dict-zh.service';
import { DictRequest, SelectedItem, UserWordChange } from '../content-types/dict-request';
import { WordAnnosComponent } from './word-annos.component';
import { ContentContext } from '../content-types/content-context';
import { AnnotateResult } from '../anno/annotate-result';
import { DictEntry } from '../models/dict-entry';
import { DictZh } from '../models/dict-zh';


// declare type TriggerMethod = Tap/Click/LongClick/RightClick/Selection

export class ContentHelperComponent {
  @ViewChild('contentText', { read: ViewContainerRef }) contentText: ViewContainerRef;
  @ViewChild('wordAnnos', { read: ViewContainerRef }) wordAnnos: ViewContainerRef;
  @Input() gotFocus: boolean;
  @Input() activeAlways: boolean;
  @Input() markNewWords: boolean;
  @Input() annotationHover: boolean;
  @Input() highlightSentence: boolean;
  @Input() contentContext: ContentContext;
  @Input() lookupDict: boolean;
  @Output() dictRequest = new EventEmitter<DictRequest>();

  lookupDictSimple = false;

  annotation: Annotation;
  contentAnnotator: Annotator;
  sentenceHoverSetup = false;
  associationsHoverSetup = false;
  annotationHoverSetup = false;
  userWordsMarked = false;

  highlightedSentences: Element[];
  highlightedWords: Element[];

  wordsPopupMap = new Map<Element, Drop>();
  wordAnnosComponentRef: ComponentRef<WordAnnosComponent>;

  contentSentenceMap: Map<string, Element>;

  combinedWordsMap: CombinedWordsMap;

  constructor(protected dictService: DictService,
              protected dictZhService: DictZhService,
              protected resolver: ComponentFactoryResolver) {
  }


  get active() {
    return this.activeAlways || this.gotFocus;
  }

  get annotationSet(): AnnotationSet {
    if (!this.contentContext) {
      return AnnotationSet.emptySet();
    }
    return this.contentContext.annotationSet;
  }

  protected getContentEl() {
    return this.contentText.element.nativeElement;
  }

  requestDict(ar: AnnotateResult, textEl, lang: LangCode, triggerMethod: string) {
    let element: any = ar.wordEl;
    let word = element.textContent;

    let oriPos = element.dataset[DataAttrNames.pos];
    let oriMeaning = element.dataset[DataAttrNames.mean];
    let oriForWord = element.dataset[DataAttrNames.word] || word;


    let meaningItemCallback = (selected: SelectedItem) => {

      if (!selected) {
        // cancel
        let { changed, removed } = AnnotatorHelper.removeDropTagIfDummy(element);
        if (changed) {
          // this.onContentChange();
          if (removed) {
            this.destroyAnnotatedWordsPopup(element);
          }
        }
        return;
      }

      if (!selected.meaning) {
        // unset
        delete element.dataset[DataAttrNames.pos];
        delete element.dataset[DataAttrNames.mean];
        delete element.dataset[DataAttrNames.word];
        let { changed, removed } = AnnotatorHelper.removeDropTagIfDummy(element);
        if (removed) {
          this.destroyAnnotatedWordsPopup(element);
        }
      } else {
        if (selected.pos !== oriPos) {
          element.dataset[DataAttrNames.pos] = selected.pos || '';
        }
        if (selected.meaning !== oriMeaning) {
          element.dataset[DataAttrNames.mean] = selected.meaning;
        }
        if (selected.word && selected.word !== oriForWord) {
          element.dataset[DataAttrNames.word] = selected.word;
        }
      }

      // this.notifyChange(side);
      if (this.annotationHoverSetup) {
        this.setupPopup(element, textEl);
      }
    };

    if (!lang || lang === Book.LangCodeEn) {
      oriForWord = AnnotatorHelper.stripEnWord(oriForWord);

      this.dictService.getEntry(oriForWord, { base: true, stem: true })
        .subscribe((entry: DictEntry) => {
          if (entry == null) {
            AnnotatorHelper.removeDropTagIfDummy(element);
            return;
          }
          let dr = new DictRequest();
          dr.dictLang = Book.LangCodeEn;
          dr.wordElement = element;
          dr.dictEntry = entry;
          dr.initialSelected = { pos: oriPos, meaning: oriMeaning } as SelectedItem;
          dr.relatedWords = null;
          // dr.context = textContext;
          if (oriForWord !== word) {
            dr.relatedWords = [word];
          }
          let phrase = AnnotatorHelper.currentPhrase(element, textEl);
          if (phrase && phrase !== word && phrase !== oriForWord) {
            if (dr.relatedWords === null) {
              dr.relatedWords = [phrase];
            } else {
              dr.relatedWords.push(phrase);
            }
          }


          let dictPopup = document.getElementById('dictPopup');
          if (dictPopup && dictPopup.contains(textEl)) {
            dr.simplePopup = this.lookupDictSimple;
          } else {
            if (triggerMethod === 'Ctrl_Click') {
              dr.simplePopup = !this.lookupDictSimple;
            } else {
              dr.simplePopup = this.lookupDictSimple;
            }
          }
          dr.meaningItemCallback = meaningItemCallback;
          dr.userWordChangeCallback = (change: UserWordChange) => {
            let { word: uwWord, dictEntry, op, familiarity } = change;
            if (dictEntry !== entry) {
              return;
            }
            const NAME_WF = DataAttrNames.wordFamiliarity;
            if (op === 'removed') {
              let codeOrUW = this.combinedWordsMap.get(uwWord);
              if (codeOrUW) {
                delete element.dataset[NAME_WF];
              } else {
                element.dataset[NAME_WF] = DataAttrValues.uwfBeyond;
              }
              return;
            }
            element.dataset[NAME_WF] = '' + familiarity;
          };
          this.dictRequest.emit(dr);
        });
    } else if (Book.isChineseText(lang)) {

      this.dictZhService.getEntry(oriForWord)
        .subscribe((entry: DictZh) => {
          if (entry == null) {
            AnnotatorHelper.removeDropTagIfDummy(element);
            return;
          }
          let dr = new DictRequest();
          dr.dictLang = Book.LangCodeZh;
          dr.wordElement = element;
          dr.dictEntry = entry;
          // dr.context = textContext;
          dr.initialSelected = { pos: oriPos, meaning: oriMeaning } as SelectedItem;
          dr.meaningItemCallback = meaningItemCallback;
          this.dictRequest.emit(dr);
        });
    }
  }

  protected destroyAnnotatedWordsPopup(element) {
    let drop: any = this.wordsPopupMap.get(element);
    if (drop) {
      drop.destroy();
      this.wordsPopupMap.delete(element);
    }
  }

  protected clearSentenceHighlights() {
    let hls = this.highlightedSentences;
    if (!hls) {
      return;
    }
    while (hls.length > 0) {
      let hl = hls.pop();
      hl.classList.remove(UIConstants.highlightClass);
    }
    this.highlightedSentences = null;
  }

  protected clearWordHighlights() {
    let hls = this.highlightedWords;
    if (!hls) {
      return;
    }
    while (hls.length > 0) {
      let hl = hls.pop();
      hl.classList.remove(UIConstants.highlightClass);
    }
    this.highlightedWords = null;
  }

  protected setupPopup(wordEl, textEl) {
    if (this.wordsPopupMap.has(wordEl)) {
      return;
    }

    if (this.annotationSet) {
      let anyAnno = AnnotatorHelper.anyAnno(wordEl, this.annotationSet);
      if (!anyAnno) {
        return;
      }
    }

    if (!this.wordAnnosComponentRef) {
      let factory: ComponentFactory<WordAnnosComponent> = this.resolver.resolveComponentFactory(WordAnnosComponent);
      this.wordAnnos.clear();
      this.wordAnnosComponentRef = this.wordAnnos.createComponent(factory);
    }
    let wacr = this.wordAnnosComponentRef;

    let component = this;

    let content = function () {
      wacr.instance.paraTextEl = textEl;
      wacr.instance.annotationSet = component.annotationSet;
      wacr.instance.enabled = component.annotationHover;
      wacr.instance.wordEl = wordEl;
      return wacr.location.nativeElement;
    };
    let drop = new Drop({
      target: wordEl,
      content,
      classes: `${UIConstants.dropClassPrefix}anno`,
      // position: 'bottom center',
      constrainToScrollParent: false,
      remove: true,
      hoverOpenDelay: 100,
      openOn: 'hover', // click,hover,always
      tetherOptions: {
        attachment: 'top center',
        constraints: [
          {
            to: 'window',
            attachment: 'together',
            pin: true
          }
        ]
      }
    });

    this.wordsPopupMap.set(wordEl, drop);
  }

  protected markUserWords(textEl) {

    if (this.userWordsMarked || !this.markNewWords || !this.combinedWordsMap || !this.active) {
      return;
    }

    let nodeIterator = document.createNodeIterator(
      textEl,
      NodeFilter.SHOW_TEXT
    );

    let textNodes = [];

    let tn;
    while (tn = nodeIterator.nextNode()) {
      textNodes.push(tn);
    }

    let wordsMap = this.combinedWordsMap;

    let wordPattern = /\b[\w­]{3,}\b/;

    for (let textNode of textNodes) {
      let text = textNode.nodeValue;
      let element = textNode.parentNode;
      let parentWholeText = element.textContent;
      if (text.trim().length < 3) {
        continue;
      }

      let baseOffset = 0;

      let matcher;
      while (matcher = text.match(wordPattern)) {
        let word = matcher[0];
        let offset = matcher.index;

        let tWord = AnnotatorHelper.stripEnWord(word);
        let codeOrUW = wordsMap.get(tWord);

        if (!codeOrUW) {
          if (/[A-Z0-9]/.test(word)
            || text.charAt(offset + word.length) === '’'
            || (offset > 0 && text.charAt(offset - 1) === '-')) {
            codeOrUW = 'ignore';
          }
        }

        let uwfValue: string = null;
        if (!codeOrUW) {
          uwfValue = DataAttrValues.uwfBeyond;
        } else if (typeof codeOrUW === 'string') {
          // base vocabulary / ignore
        } else {
          let uw = codeOrUW as UserWord;
          if (uw.familiarity === UserWord.FamiliarityHighest) {
            // grasped
          } else {
            uwfValue = '' + uw.familiarity;
          }
        }

        if (!uwfValue) {
          if (word.length + 3 >= text.length) {
            break;
          }
          let from = offset + word.length;
          text = text.substr(from);
          baseOffset += from;
          continue;
        }

        if (word === parentWholeText) {
          element.dataset[DataAttrNames.wordFamiliarity] = uwfValue;
          break;
        }

        let totalOffset = baseOffset + offset;
        if (totalOffset > 0) {
          textNode = textNode.splitText(totalOffset);
        }
        let wordNode = textNode;
        if (offset + word.length < text.length) {
          textNode = wordNode.splitText(word.length);
        }

        let wrapping = document.createElement(UIConstants.userWordTagName);
        wrapping.dataset[DataAttrNames.wordFamiliarity] = uwfValue;
        element.replaceChild(wrapping, wordNode);
        wrapping.appendChild(wordNode);

        if (offset + word.length + 3 >= text.length) {
          break;
        }
        text = textNode.nodeValue;
        baseOffset = 0;
      }
    }

    this.userWordsMarked = true;
  }


  protected clearHovers() {
    this.contentSentenceMap = null;
    this.sentenceHoverSetup = false;
    this.associationsHoverSetup = false;
    this.annotationHoverSetup = false;
  }
}
