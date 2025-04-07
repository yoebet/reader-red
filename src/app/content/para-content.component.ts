import {
  OnChanges, Input, SimpleChanges, Output, EventEmitter,
  Component, ViewChild, ViewContainerRef,
  ComponentFactoryResolver, ComponentFactory, ComponentRef, OnInit
} from '@angular/core';

import Drop from 'tether-drop';

import {Annotator} from '../anno/annotator';
import {AnnotateResult} from '../anno/annotate-result';
import {AnnotationSet, HighlightGroups} from '../anno/annotation-set';

import {UIConstants} from '../config';
import {Para} from '../models/para';
import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';
import {DictRequest} from '../chap/dict-request';
import {WordAnnosComponent} from './word-annos.component';
import {UserWord} from '../models/user-word';
import {UserVocabularyService} from '../services/user-vocabulary.service';
import {CombinedWordsMap} from '../en/combined-words-map';

@Component({
  selector: 'para-content',
  templateUrl: './para-content.component.html',
  styleUrls: ['./para-content.component.css']
})
export class ParaContentComponent implements OnInit, OnChanges {
  @ViewChild('contentText', {read: ViewContainerRef}) contentText: ViewContainerRef;
  @ViewChild('paraTrans', {read: ViewContainerRef}) paraTrans: ViewContainerRef;
  @ViewChild('wordAnnos', {read: ViewContainerRef}) wordAnnos: ViewContainerRef;
  @Input() para: Para;
  @Input() showTrans: boolean;
  @Input() gotFocus: boolean;
  @Input() activeAlways: boolean;
  @Input() lookupDict: boolean;
  @Input() highlightSentence: boolean;
  @Input() markNewWords: boolean;
  @Input() annotatedWordsHover: boolean;
  @Input() annotationSet: AnnotationSet;

  @Output() dictRequest = new EventEmitter<DictRequest>();

  transRendered = false;
  sentenceHoverSetup = false;
  associatedWordsHoverSetup = false;
  annotatedWordsHoverSetup = false;
  wordMarked = false;

  highlightedSentences: Element[];
  highlightedWords: Element[];
  wordsPopupMap = new Map<Element, Drop>();
  wordAnnosComponentRef: ComponentRef<WordAnnosComponent>;

  static highlightWordsSelector = HighlightGroups.highlightAnnotationSelectors;
  annotator: Annotator;

  combinedWordsMap: CombinedWordsMap;


  constructor(private dictService: DictService,
              private userVocabularyService: UserVocabularyService,
              private resolver: ComponentFactoryResolver) {
  }

  get active() {
    return this.activeAlways || this.gotFocus;
  }

  ngOnInit(): void {
    this.userVocabularyService.getCombinedWordsMap()
      .subscribe((map: CombinedWordsMap) => {
        this.combinedWordsMap = map;
        if (this.active) {
          this.markUserNewWords();
        }
      });

    if (this.activeAlways) {
      this.setupAssociatedWordsHover();
      this.setupAnnotatedWordsHover();
    }
  }

  private currentPhrase(wordEl) {
    let stEl = this.findSentence(wordEl);
    if (!stEl) {
      stEl = this.contentText.element.nativeElement;
    }
    let ds = wordEl.dataset;
    let group = ds.phra;
    if (!group) {
      return null;
    }
    if (!/^g\d$/.test(group)) {
      return null;
    }
    let groupSelector = `[data-phra=${group}]`;
    let groupEls = stEl.querySelectorAll(groupSelector);
    let els = Array.from(groupEls);
    return els.map((el: Element) => el.textContent).join(' ');
  }

  private removeTagIfDummy(el) {
    let result = {changed: false, removed: false};
    if (el.tagName !== Annotator.annotationTagName.toUpperCase()) {
      return result;
    }
    if (el.className === '') {
      el.removeAttribute('class');
      result.changed = true;
    } else if (el.attributes.length === 1 && el.hasAttributes('class')) {
      let cns = el.className.split(' ')
        .filter(n => !n.startsWith(UIConstants.dropClassPrefix)
          && !n.startsWith(UIConstants.tetherClassPrefix)
          && n !== UIConstants.highlightClass);
      if (cns.length === 0) {
        el.removeAttribute('class');
        result.changed = true;
      }
    }
    if (!el.hasAttributes()) {
      //remove tag
      let pp = el.parentNode;
      if (!pp) {
        return result;
      }
      while (el.firstChild) {
        pp.insertBefore(el.firstChild, el);
      }
      pp.removeChild(el);
      pp.normalize();
      result.changed = true;
      result.removed = true;
    }
    return result;
  }

  lookupWordsMeaning() {
    this.annotator.switchAnnotation(this.annotationSet.wordMeaningAnnotation);
    let ar: AnnotateResult = this.annotator.annotate();
    if (!ar || !ar.wordEl) {
      return;
    }
    let element: any = ar.wordEl;
    let word = element.textContent;

    let oriMid = null;
    let dataName = 'mid';
    if (element.dataset[dataName]) {
      let mid = parseInt(element.dataset[dataName]);
      if (!isNaN(mid)) {
        oriMid = mid;
      }
    }
    let oriForWord = element.dataset.word || word;

    this.dictService.getEntry(oriForWord, {base: true, stem: true})
      .subscribe((entry: DictEntry) => {
        if (entry == null) {
          this.removeTagIfDummy(element);
          return;
        }
        let dr = new DictRequest();
        dr.wordElement = element;
        dr.dictEntry = entry;
        dr.meaningItemId = oriMid;
        dr.relatedWords = null;
        let paraId = this.para._id;
        let chap = this.para.chap;
        let chapId = chap._id;
        let bookId = chap.book._id;
        dr.context = {bookId, chapId, paraId};
        dr.onClose = () => {
          this.removeTagIfDummy(element);
        };
        if (oriForWord !== word) {
          dr.relatedWords = [word];
        }
        let phrase = this.currentPhrase(element);
        if (phrase && phrase !== word && phrase !== oriForWord) {
          if (dr.relatedWords === null) {
            dr.relatedWords = [phrase];
          } else {
            dr.relatedWords.push(phrase);
          }
        }
        this.dictRequest.emit(dr);
      });
  }

  onMouseup($event) {
    if (!this.active) {
      return;
    }
    $event.stopPropagation();
    let ctrlKey = $event.ctrlKey || $event.metaKey;
    if ((!ctrlKey && this.lookupDict) || (ctrlKey && !this.lookupDict)) {
      if (!this.annotator) {
        let contentEl = this.contentText.element.nativeElement;
        this.annotator = new Annotator(contentEl);
      }
      this.lookupWordsMeaning();
    }
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

  private setupSentenceHover() {

    if (this.sentenceHoverSetup || !this.highlightSentence || !this.gotFocus) {
      return;
    }

    let contentEl = this.contentText.element.nativeElement;
    let transEl = this.paraTrans.element.nativeElement;
    let contentMap = new Map<string, Element>();
    let transMap = new Map<string, Element>();
    for (let [textEl, selMap] of [[contentEl, contentMap], [transEl, transMap]]) {
      let sentenceEls = textEl.querySelectorAll(UIConstants.sentenceTagName);
      for (let stEl of sentenceEls) {
        if (!stEl.dataset) {
          continue;
        }
        let sid = stEl.dataset.sid;
        if (sid) {
          selMap.set(sid, stEl);
        }
      }
    }

    let component = this;

    let sentenceMouseover = function (event) {
      if (!component.highlightSentence || !component.gotFocus) {
        return;
      }
      let el = this;
      if (!el.dataset) {
        return;
      }
      let sid = el.dataset.sid;
      if (!sid) {
        return;
      }

      component.clearSentenceHighlights();
      for (let selMap of [contentMap, transMap]) {
        let tsEl = selMap.get(sid);
        if (tsEl) {
          tsEl.classList.add(UIConstants.highlightClass);
          if (!component.highlightedSentences) {
            component.highlightedSentences = [];
          }
          component.highlightedSentences.push(tsEl);
        }
      }
    };

    for (let textEl of [contentEl, transEl]) {
      let sentenceEls = textEl.querySelectorAll(UIConstants.sentenceTagName);
      for (let sentenceEl of sentenceEls) {
        sentenceEl.addEventListener('mouseover', sentenceMouseover);
      }
    }

    this.sentenceHoverSetup = true;
  }

  private findSentence(node): any {
    let contentTextEl = this.contentText.element.nativeElement;
    let sentenceSelector = UIConstants.sentenceTagName;
    do {
      if (node instanceof Element) {
        let el = node as Element;
        if (el === contentTextEl) {
          return null;
        }
        if (el.matches(sentenceSelector)) {
          return el;
        }
      }
      node = node.parentNode;
    } while (node);
    return null;
  }

  private highlightAssociatedWords(wordEl) {

    let component = this;

    let wordsMouseleave = function (event) {
      component.clearWordHighlights();
    };

    let wordsMouseover = function (event) {
      component.clearWordHighlights();

      let el = this;
      let stEl = component.findSentence(el);
      if (!stEl) {
        stEl = component.contentText.element.nativeElement;
      }

      let groupSelector = HighlightGroups.matchGroup(el);
      if (!groupSelector) {
        return;
      }
      let annEls = stEl.querySelectorAll(groupSelector);
      for (let annEl of annEls) {
        annEl.classList.add(UIConstants.highlightClass);
        if (!component.highlightedWords) {
          component.highlightedWords = [];
        }
        component.highlightedWords.push(annEl);
      }
    };

    wordEl.addEventListener('mouseover', wordsMouseover);
    wordEl.addEventListener('mouseleave', wordsMouseleave);
  }

  private setupAssociatedWordsHover() {

    if (this.associatedWordsHoverSetup || !this.active) {
      return;
    }

    let contentEl = this.contentText.element.nativeElement;
    let annEls = contentEl.querySelectorAll(ParaContentComponent.highlightWordsSelector);
    for (let annEl of annEls) {
      this.highlightAssociatedWords(annEl);
    }

    this.associatedWordsHoverSetup = true;
  }


  private showAnnotationsHover(wordEl) {
    if (this.wordsPopupMap.has(wordEl)) {
      return;
    }

    if (!this.wordAnnosComponentRef) {
      let factory: ComponentFactory<WordAnnosComponent> = this.resolver.resolveComponentFactory(WordAnnosComponent);
      this.wordAnnos.clear();
      this.wordAnnosComponentRef = this.wordAnnos.createComponent(factory);
    }
    let wacr = this.wordAnnosComponentRef;
    wacr.instance.paraTextEl = this.contentText.element.nativeElement;
    let component = this;

    let content = function () {
      wacr.instance.enabled = component.annotatedWordsHover;
      wacr.instance.wordEl = wordEl;
      wacr.instance.annotationSet = component.annotationSet;
      return wacr.location.nativeElement;
    };
    let drop = new Drop({
      target: wordEl,
      content: content,
      classes: `${UIConstants.dropClassPrefix}anno`,
      position: 'bottom center',
      constrainToScrollParent: false,
      remove: true,
      hoverOpenDelay: 100,
      openOn: 'hover'//click,hover,always
    });

    this.wordsPopupMap.set(wordEl, drop);
  }


  private setupAnnotatedWordsHover() {

    if (this.annotatedWordsHoverSetup || !this.annotatedWordsHover || !this.active) {
      return;
    }

    this.wordsPopupMap.clear();

    let contentEl = this.contentText.element.nativeElement;
    let annEls = contentEl.querySelectorAll(UIConstants.annotationTagName);
    for (let annEl of annEls) {
      this.showAnnotationsHover(annEl);
    }

    this.annotatedWordsHoverSetup = true;
  }

  markUserNewWords() {

    if (this.wordMarked || !this.markNewWords || !this.combinedWordsMap || !this.active) {
      return;
    }

    let contentHolder = this.contentText.element.nativeElement;

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

    let wordPattern = /\b\w{3,}\b/;

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

        let codeOrUW = wordsMap.get(word);

        if (!codeOrUW) {
          if (/[A-Z]/.test(word)
            || text.charAt(offset + word.length) === '’'
            || (offset > 0 && text.charAt(offset - 1) === '-')) {
            codeOrUW = 'ignore';
          }
        }

        let wordClasses: string[];
        if (!codeOrUW) {
          wordClasses = [UIConstants.userWordBeyondClass];
        } else if (typeof codeOrUW === 'string') {
          // base vocabulary
        } else {
          let uw = codeOrUW as UserWord;
          if (uw.familiarity === UserWord.FamiliarityHighest) {
            // grasped
          } else {
            wordClasses = [UIConstants.userWordFamiliarityClassPrefix + uw.familiarity];
          }
        }

        if (!wordClasses) {
          if (word.length + 3 >= text.length) {
            break;
          }
          let from = offset + word.length;
          text = text.substr(from);
          baseOffset += from;
          continue;
        }

        wordClasses.unshift(UIConstants.userWordCommonClass);

        if (word === parentWholeText) {
          element.classList.add(...wordClasses);
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
        wrapping.classList.add(...wordClasses);
        element.replaceChild(wrapping, wordNode);
        wrapping.appendChild(wordNode);

        if (offset + word.length + 3 >= text.length) {
          break;
        }
        text = textNode.nodeValue;
        baseOffset = 0;
      }
    }

    this.wordMarked = true;
  }

  refreshContent() {
    let html = this.para.content || ' ';
    this.contentText.element.nativeElement.innerHTML = html;

    this.sentenceHoverSetup = false;
    this.associatedWordsHoverSetup = false;
    this.annotatedWordsHoverSetup = false;
    this.transRendered = false;

    this.markUserNewWords();
  }

  refreshTrans() {
    let html = this.para.trans || ' ';
    this.paraTrans.element.nativeElement.innerHTML = html;
    this.transRendered = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.para) {
      this.refreshContent();
    }
    if (this.showTrans && !this.transRendered) {
      this.refreshTrans();
      this.sentenceHoverSetup = false;
    }

    if (this.highlightedSentences && (!this.gotFocus || !this.sentenceHoverSetup || !this.highlightSentence)) {
      this.clearSentenceHighlights();
    }
    if (this.highlightedWords && (!this.gotFocus || changes.content)) {
      this.clearWordHighlights();
    }

    if (changes.markNewWords && this.markNewWords) {
      this.markUserNewWords();
    }

    if (this.gotFocus) {
      this.markUserNewWords();
      this.setupSentenceHover();
      this.setupAssociatedWordsHover();
      this.setupAnnotatedWordsHover();
    }
  }
}
