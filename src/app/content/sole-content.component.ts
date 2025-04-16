import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

import * as Drop from 'tether-drop';

import { Annotator } from '../anno/annotator';
import { AnnotatorHelper } from '../anno/annotator-helper';
import { AnnotateResult } from '../anno/annotate-result';
import { AnnotationSet, HighlightGroups } from '../anno/annotation-set';
import { CombinedWordsMap } from '../en/combined-words-map';

import { DataAttrNames, DataAttrValues, SpecialAnnotations, UIConstants } from '../config';
import { DictEntry } from '../models/dict-entry';
import { DictZh } from '../models/dict-zh';
import { Annotation } from '../models/annotation';
import { Book } from '../models/book';
import { UserWord } from '../models/user-word';

import { DictService } from '../services/dict.service';
import { DictZhService } from '../services/dict-zh.service';
import { DictRequest, SelectedItem, UserWordChange } from '../content-types/dict-request';
import { WordAnnosComponent } from './word-annos.component';
import { ContentContext } from '../content-types/content-context';


// declare type TriggerMethod = Tap/Click/LongClick/RightClick/Selection

@Component({
  selector: 'sole-content',
  templateUrl: './sole-content.component.html'
})
export class SoleContentComponent implements OnInit, OnChanges {
  @ViewChild('contentText', { read: ViewContainerRef }) contentText: ViewContainerRef;
  @ViewChild('wordAnnos', { read: ViewContainerRef }) wordAnnos: ViewContainerRef;
  @Input() content: string;
  @Input() gotFocus: boolean;
  @Input() activeAlways: boolean;
  @Input() markNewWords: boolean;
  @Input() annotationHover: boolean;
  @Input() contentContext: ContentContext;
  @Output() dictRequest = new EventEmitter<DictRequest>();

  highlightSentence = false;
  lookupDict = true;
  lookupDictSimple = true;

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

  get textLang() {
    return this.contentContext && this.contentContext.contentLang || Book.LangCodeEn;
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

  ngOnInit(): void {
    let wmObs = this.contentContext.combinedWordsMapObs;
    if (wmObs) {
      if (!this.textLang || this.textLang === Book.LangCodeEn) {
        wmObs.subscribe((map: CombinedWordsMap) => {
          this.combinedWordsMap = map;
          if (this.active) {
            this.markUserWords();
          }
        });
      }
    }

    if (this.activeAlways) {
      this.setupAssociationHover();
      this.setupAnnotationsPopup();
    }
  }

  getAnnotator(annotation = null): Annotator {
    let annt = this.contentAnnotator;
    if (!annt) {
      let el = this.getTextEl();
      annt = new Annotator(el, this.textLang);
      this.contentAnnotator = annt;
    }
    if (Book.isChineseText(annt.lang) && !annt.zhPhrases) {
      annt.zhPhrases = this.contentContext.zhPhrases;
    }
    annt.switchAnnotation(annotation || this.annotation);
    return annt;
  }

  private getTextEl() {
    return this.contentText.element.nativeElement;
  }

  private destroyAnnotatedWordsPopup(element) {
    let drop: any = this.wordsPopupMap.get(element);
    if (drop) {
      drop.destroy();
      this.wordsPopupMap.delete(element);
    }
  }

  selectWordMeaning($event, triggerMethod = null) {
    let ann = AnnotationSet.selectMeaningAnnotation;
    let ar: AnnotateResult = this.getAnnotator(ann).annotate($event);
    if (!ar || !ar.wordEl) {
      return;
    }
    let element: any = ar.wordEl;
    let word = element.textContent;

    let oriPos = element.dataset[DataAttrNames.pos];
    let oriMeaning = element.dataset[DataAttrNames.mean];
    let oriForWord = element.dataset[DataAttrNames.word] || word;

    let textEl = this.getTextEl();

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

      this.notifyChange();
      if (this.annotationHoverSetup) {
        this.setupPopup(element, textEl);
      }
    };

    if (!this.textLang || this.textLang === Book.LangCodeEn) {
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
          let contentEl = this.getTextEl();
          if (dictPopup && dictPopup.contains(contentEl)) {
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
    } else if (Book.isChineseText(this.textLang)) {

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
          dr.initialSelected = { pos: oriPos, meaning: oriMeaning } as SelectedItem;
          dr.meaningItemCallback = meaningItemCallback;
          this.dictRequest.emit(dr);
        });
    }
  }

  private doAnnotate($event, triggerMethod = null) {
    if (this.annotation.nameEn === SpecialAnnotations.SelectMeaning.nameEn) {
      this.selectWordMeaning($event, triggerMethod);
      return;
    }
    let ar: AnnotateResult = this.getAnnotator().annotate($event);
    if (!ar) {
      return;
    }
    if (ar.wordEl) {
      if (ar.elCreated) {
        let textEl = this.getTextEl();
        if (ar.wordEl.matches(HighlightGroups.HighlightSelectors)) {
          this.highlightAssociatedWords(ar.wordEl, textEl);
        }
        if (this.annotationHoverSetup) {
          this.setupPopup(ar.wordEl, textEl);
        }
      }
      if (ar.operation === 'remove') {
        let { changed, removed } = AnnotatorHelper.removeDropTagIfDummy(ar.wordEl);
        if (removed) {
          this.destroyAnnotatedWordsPopup(ar.wordEl);
        }
      }
      this.notifyChange();
    }
  }

  onMouseup($event) {
    console.log(event);
    $event.stopPropagation();
    $event.preventDefault();
    if ($event.which === 3) {
      return;
    }
    let triggerMethod = 'Click';

    let ctrl = $event.ctrlKey || $event.metaKey;
    if (ctrl) {
      triggerMethod = 'Ctrl_' + triggerMethod;
    }
    if (this.lookupDict) {
      this.selectWordMeaning($event, triggerMethod);
      return;
    }
    if (ctrl) {
      this.selectWordMeaning($event, triggerMethod);
      return;
    }
    let selection = window.getSelection();
    if (selection && selection.anchorOffset !== selection.focusOffset) {
      this.selectWordMeaning($event, triggerMethod);
      return;
    }
    if (!this.gotFocus) {
      return;
    }
    if (!this.annotation) {
      return;
    }
    this.doAnnotate($event, triggerMethod);
  }

  onContextmenu($event) {
    this.selectWordMeaning($event, 'RightClick');
    $event.stopPropagation();
    $event.preventDefault();
  }

  private notifyChange() {
  }

  private clearSentenceHighlights() {
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

  private clearWordHighlights() {
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

  private setupSentenceIdMap() {
    if (this.contentSentenceMap != null) {
      return;
    }
    this.contentSentenceMap = new Map<string, Element>();
    let contentEl = this.getTextEl();
    let sentenceEls = contentEl.querySelectorAll(UIConstants.sentenceTagName);
    for (let stEl of sentenceEls) {
      if (!stEl.dataset) {
        continue;
      }
      let sid = stEl.dataset[UIConstants.sentenceIdAttrName];
      if (sid) {
        this.contentSentenceMap.set(sid, stEl);
      }
    }
  }

  private setupSentenceHover() {

    if (this.sentenceHoverSetup || !this.highlightSentence) {
      return;
    }

    this.setupSentenceIdMap();

    let component = this;

    let sentenceMouseover = function (event) {
      if (!component.highlightSentence) {
        return;
      }
      let el = this;
      if (!el.dataset) {
        return;
      }
      let sid = el.dataset[UIConstants.sentenceIdAttrName];
      if (!sid) {
        return;
      }

      component.clearSentenceHighlights();
      let tsEl = component.contentSentenceMap.get(sid);
      if (tsEl) {
        tsEl.classList.add(UIConstants.highlightClass);
        if (!component.highlightedSentences) {
          component.highlightedSentences = [];
        }
        component.highlightedSentences.push(tsEl);
      }
    };

    let contentEl = this.getTextEl();
    let sentenceEls = contentEl.querySelectorAll(UIConstants.sentenceTagName);
    for (let sentenceEl of sentenceEls) {
      sentenceEl.addEventListener('mouseover', sentenceMouseover);
    }

    this.sentenceHoverSetup = true;
  }

  private highlightAssociatedWords(wordEl, textEl) {

    let component = this;

    let wordsMouseleave = function (event) {
      component.clearWordHighlights();
    };

    let wordsMouseover = function (event) {
      component.clearWordHighlights();

      let el = this;
      let stEl = AnnotatorHelper.findSentence(el, textEl);
      if (!stEl) {
        stEl = textEl;
      }

      let groupSelector = HighlightGroups.matchGroup(el);
      if (!groupSelector) {
        return;
      }
      if (!component.highlightedWords) {
        component.highlightedWords = [];
      }

      let annEls = stEl.querySelectorAll(groupSelector);
      for (let annEl of annEls) {
        annEl.classList.add(UIConstants.highlightClass);
        component.highlightedWords.push(annEl);
      }
    };

    wordEl.addEventListener('mouseover', wordsMouseover);
    wordEl.addEventListener('mouseleave', wordsMouseleave);
  }

  private setupAssociationHover() {

    if (this.associationsHoverSetup || !this.active) {
      return;
    }

    this.setupSentenceIdMap();

    let contentEl = this.getTextEl();

    let selector = HighlightGroups.HighlightSelectors;

    let annEls = contentEl.querySelectorAll(selector);
    for (let annEl of annEls) {
      this.highlightAssociatedWords(annEl, contentEl);
    }

    this.associationsHoverSetup = true;
  }


  private setupPopup(wordEl, textEl) {
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


  private setupAnnotationsPopup() {

    if (this.annotationHoverSetup || !this.annotationHover || !this.active) {
      return;
    }

    this.wordsPopupMap.clear();

    let contentEl = this.getTextEl();
    let annEls = contentEl.querySelectorAll(UIConstants.annotationTagName);
    for (let annEl of annEls) {
      this.setupPopup(annEl, contentEl);
    }

    this.annotationHoverSetup = true;
  }

  private markUserWords() {

    if (this.userWordsMarked || !this.markNewWords || !this.combinedWordsMap || !this.active) {
      return;
    }

    let contentHolder = this.getTextEl();

    let nodeIterator = document.createNodeIterator(
      contentHolder,
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

  private clearHovers() {
    this.contentSentenceMap = null;
    this.sentenceHoverSetup = false;
    this.associationsHoverSetup = false;
    this.annotationHoverSetup = false;
  }

  private setupHovers() {
    this.setupSentenceHover();
    this.setupAssociationHover();
    this.setupAnnotationsPopup();
  }

  ngOnChanges(changes: SimpleChanges) {
    let textChanged = false;
    if (changes.content) {
      this.getTextEl().innerHTML = this.content || ' ';
      textChanged = true;
    }

    if (this.highlightedSentences && (!this.gotFocus || !this.sentenceHoverSetup || !this.highlightSentence)) {
      this.clearSentenceHighlights();
    }
    if (this.highlightedWords && (!this.gotFocus || changes.content)) {
      this.clearWordHighlights();
    }

    if (textChanged) {
      this.clearHovers();
      this.setupHovers();
    }
  }
}
