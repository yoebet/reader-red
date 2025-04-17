import { Component, ComponentFactoryResolver, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';

import { Annotator } from '../anno/annotator';
import { AnnotatorHelper } from '../anno/annotator-helper';
import { AnnotateResult } from '../anno/annotate-result';
import { AnnotationSet, HighlightGroups } from '../anno/annotation-set';
import { CombinedWordsMap } from '../en/combined-words-map';

import { SpecialAnnotations, UIConstants } from '../config';
import { Para } from '../models/para';
import { Book, LangCode } from '../models/book';

import { DictService } from '../services/dict.service';
import { DictZhService } from '../services/dict-zh.service';
import { ContentHelperComponent } from './content-helper.component';


declare type Side = 'content'|'trans';

const SideContent: Side = 'content';
const SideTrans: Side = 'trans';

// declare type TriggerMethod = Tap/Click/LongClick/RightClick/Selection

@Component({
  selector: 'para-content',
  templateUrl: './para-content.component.html'
})
export class ParaContentComponent extends ContentHelperComponent implements OnInit, OnChanges {
  @ViewChild('transText', { read: ViewContainerRef }) transText: ViewContainerRef;
  @Input() para: Para;
  @Input() showTrans: boolean;

  lookupDictSimple = false;

  transAnnotator: Annotator;
  transRendered = false;

  transSentenceMap: Map<string, Element>;


  constructor(protected dictService: DictService,
              protected dictZhService: DictZhService,
              protected resolver: ComponentFactoryResolver) {
    super(dictService, dictZhService, resolver);
  }

  ngOnInit(): void {
    let wmObs = this.contentContext.combinedWordsMapObs;
    if (wmObs) {
      let contentLang = this.getTextLang(SideContent);
      if (!contentLang || contentLang === Book.LangCodeEn) {
        wmObs.subscribe((map: CombinedWordsMap) => {
          this.combinedWordsMap = map;
          if (this.active) {
            const el = this.getContentEl();
            this.markUserWords(el);
          }
        });
      }
    }

    if (this.activeAlways) {
      this.setupAssociationHover();
      // TODO: if (!this.annotationSet)
      this.setupAnnotationsPopup();
    }
  }

  getTextLang(side: Side): LangCode {
    let { contentLang, transLang } = this.contentContext;
    return (side === SideContent) ? (contentLang || Book.LangCodeEn) : (transLang || Book.LangCodeZh);
  }

  getAnnotator(side: Side, annotation = null): Annotator {
    let annt;
    if (side === SideContent) {
      annt = this.contentAnnotator;
      if (!annt) {
        let el = this.getContentEl();
        let lang = this.getTextLang(side);
        annt = new Annotator(el, lang);
        this.contentAnnotator = annt;
      }
    } else {
      annt = this.transAnnotator;
      if (!annt) {
        let el = this.getTransEl();
        let lang = this.getTextLang(side);
        annt = new Annotator(el, lang);
        this.transAnnotator = annt;
      }
    }
    if (Book.isChineseText(annt.lang) && !annt.zhPhrases) {
      annt.zhPhrases = this.contentContext.zhPhrases;
    }
    annt.switchAnnotation(annotation || this.annotation);
    return annt;
  }

  private getTransEl() {
    return this.transText.element.nativeElement;
  }

  private getTextEl(side: Side) {
    return side === SideContent ?
      this.getContentEl() :
      this.getTransEl();
  }

  private getTheOtherSideText(textEl) {
    return textEl === this.getTransEl() ?
      this.getContentEl() :
      this.getTransEl();
  }

  selectWordMeaning(side: Side, $event, triggerMethod = null) {
    let ann = AnnotationSet.selectMeaningAnnotation;
    let ar: AnnotateResult = this.getAnnotator(side, ann).annotate($event);
    if (!ar || !ar.wordEl) {
      return;
    }
    let textEl = this.getTextEl(side);
    let lang = this.getTextLang(side);
    return this.requestDict(ar, textEl, lang, triggerMethod);
  }

  private doAnnotate(side: Side, $event, triggerMethod = null) {
    if (this.annotation.nameEn === SpecialAnnotations.SelectMeaning.nameEn) {
      this.selectWordMeaning(side, $event, triggerMethod);
      return;
    }
    /*if (this.annotation.nameEn === SpecialAnnotations.AddANote.nameEn) {
      this.addANote(side, triggerMethod);
      return;
    }*/
    let ar: AnnotateResult = this.getAnnotator(side).annotate($event);
    if (!ar) {
      return;
    }
    if (ar.wordEl) {
      if (ar.elCreated) {
        let textEl = this.getTextEl(side);
        if (ar.wordEl.matches(HighlightGroups.HighlightSelectors)) {
          this.highlightAssociatedWords(ar.wordEl, textEl, this.getTheOtherSideText(textEl));
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
      // this.notifyChange(side);
    }
  }

  onMouseup($event, side: Side) {
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
      this.selectWordMeaning(side, $event, triggerMethod);
      return;
    }
    if (ctrl) {
      this.selectWordMeaning(side, $event, triggerMethod);
      return;
    }
    let selection = window.getSelection();
    if (selection && selection.anchorOffset !== selection.focusOffset) {
      this.selectWordMeaning(side, $event, triggerMethod);
      return;
    }
    if (!this.gotFocus) {
      return;
    }
    if (!this.annotation) {
      return;
    }
    this.doAnnotate(side, $event, triggerMethod);
  }

  onContextmenu($event, side: Side) {
    this.selectWordMeaning(side, $event, 'RightClick');
    $event.stopPropagation();
    $event.preventDefault();
  }

  private setupSentenceIdMap() {
    if (this.contentSentenceMap != null) {
      return;
    }
    this.contentSentenceMap = new Map<string, Element>();
    this.transSentenceMap = new Map<string, Element>();
    let contentEl = this.getContentEl();
    let transEl = this.getTransEl();
    for (let [textEl, selMap] of [[contentEl, this.contentSentenceMap], [transEl, this.transSentenceMap]]) {
      let sentenceEls = textEl.querySelectorAll(UIConstants.sentenceTagName);
      for (let stEl of sentenceEls) {
        if (!stEl.dataset) {
          continue;
        }
        let sid = stEl.dataset[UIConstants.sentenceIdAttrName];
        if (sid) {
          selMap.set(sid, stEl);
        }
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
      for (let selMap of [component.contentSentenceMap, component.transSentenceMap]) {
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

    let contentEl = this.getContentEl();
    let transEl = this.getTransEl();
    for (let textEl of [contentEl, transEl]) {
      let sentenceEls = textEl.querySelectorAll(UIConstants.sentenceTagName);
      for (let sentenceEl of sentenceEls) {
        sentenceEl.addEventListener('mouseover', sentenceMouseover);
      }
    }

    this.sentenceHoverSetup = true;
  }

  private highlightAssociatedWords(wordEl, textEl, theOtherTextEl) {

    let theOtherSentenceMap = (textEl === this.getContentEl()) ?
      this.transSentenceMap : this.contentSentenceMap;

    let component = this;

    // tslint:disable-next-line:only-arrow-functions
    let wordsMouseleave = function (event) {
      component.clearWordHighlights();
    };

    let wordsMouseover = function (event) {
      component.clearWordHighlights();

      let el = this;
      let stEl = AnnotatorHelper.findSentence(el, textEl);
      let stEl2;
      if (stEl) {
        if (stEl.dataset) {
          let sid = stEl.dataset[UIConstants.sentenceIdAttrName];
          stEl2 = theOtherSentenceMap.get(sid);
        }
      } else {
        stEl = textEl;
        stEl2 = theOtherTextEl;
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
      if (stEl2) {
        let annEls2 = stEl2.querySelectorAll(groupSelector);
        for (let annEl of annEls2) {
          annEl.classList.add(UIConstants.highlightClass);
          component.highlightedWords.push(annEl);
        }
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

    let contentEl = this.getContentEl();
    let transEl = this.getTransEl();

    let selector = HighlightGroups.HighlightSelectors;

    let annEls = contentEl.querySelectorAll(selector);
    for (let annEl of annEls) {
      this.highlightAssociatedWords(annEl, contentEl, transEl);
    }

    let tAnnEls = transEl.querySelectorAll(selector);
    for (let annEl of tAnnEls) {
      this.highlightAssociatedWords(annEl, transEl, contentEl);
    }

    this.associationsHoverSetup = true;
  }

  private setupAnnotationsPopup() {

    if (this.annotationHoverSetup || !this.annotationHover || !this.active) {
      return;
    }

    this.wordsPopupMap.clear();

    let contentEl = this.getContentEl();
    let annEls = contentEl.querySelectorAll(UIConstants.annotationTagName);
    for (let annEl of annEls) {
      this.setupPopup(annEl, contentEl);
    }

    let transEl = this.getTransEl();
    let tAnnEls = transEl.querySelectorAll(UIConstants.annotationTagName);
    for (let annEl of tAnnEls) {
      this.setupPopup(annEl, transEl);
    }

    this.annotationHoverSetup = true;
  }

  private setupHovers() {
    this.setupSentenceHover();
    this.setupAssociationHover();
    this.setupAnnotationsPopup();
  }

  ngOnChanges(changes: SimpleChanges) {
    let textChanged = false;
    if (changes.para) {
      this.getContentEl().innerHTML = this.para.content || ' ';
      textChanged = true;
    }
    if (this.showTrans && !this.transRendered) {
      this.getTransEl().innerHTML = this.para.trans || ' ';
      this.transRendered = true;
      textChanged = true;
    }

    if (this.highlightedSentences && (!this.gotFocus || !this.sentenceHoverSetup || !this.highlightSentence)) {
      this.clearSentenceHighlights();
    }
    if (this.highlightedWords && (!this.gotFocus || changes.content || changes.trans)) {
      this.clearWordHighlights();
    }

    if (textChanged) {
      this.clearHovers();
      this.setupHovers();
    }
  }
}
