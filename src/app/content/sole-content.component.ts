import { Component, ComponentFactoryResolver, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { Annotator } from '../anno/annotator';
import { AnnotatorHelper } from '../anno/annotator-helper';
import { AnnotateResult } from '../anno/annotate-result';
import { AnnotationSet, HighlightGroups } from '../anno/annotation-set';
import { CombinedWordsMap } from '../en/combined-words-map';

import { SpecialAnnotations, UIConstants } from '../config';
import { Book } from '../models/book';

import { DictService } from '../services/dict.service';
import { DictZhService } from '../services/dict-zh.service';
import { ContentHelperComponent } from './content-helper.component';


// declare type TriggerMethod = Tap/Click/LongClick/RightClick/Selection

@Component({
  selector: 'sole-content',
  templateUrl: './sole-content.component.html'
})
export class SoleContentComponent extends ContentHelperComponent implements OnInit, OnChanges {
  @Input() content: string;

  lookupDict = true;
  lookupDictSimple = true;
  highlightSentence = false;

  constructor(protected dictService: DictService,
              protected dictZhService: DictZhService,
              protected resolver: ComponentFactoryResolver) {
    super(dictService, dictZhService, resolver);
  }

  get textLang() {
    return this.contentContext && this.contentContext.contentLang || Book.LangCodeEn;
  }

  ngOnInit(): void {
    let wmObs = this.contentContext.combinedWordsMapObs;
    if (wmObs) {
      if (!this.textLang || this.textLang === Book.LangCodeEn) {
        wmObs.subscribe((map: CombinedWordsMap) => {
          this.combinedWordsMap = map;
          if (this.active) {
            this.markUserWords(this.getContentEl());
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
      let el = this.getContentEl();
      annt = new Annotator(el, this.textLang);
      this.contentAnnotator = annt;
    }
    if (Book.isChineseText(annt.lang) && !annt.zhPhrases) {
      annt.zhPhrases = this.contentContext.zhPhrases;
    }
    annt.switchAnnotation(annotation || this.annotation);
    return annt;
  }

  selectWordMeaning($event, triggerMethod = null) {
    let ann = AnnotationSet.selectMeaningAnnotation;
    let ar: AnnotateResult = this.getAnnotator(ann).annotate($event);
    if (!ar || !ar.wordEl) {
      return;
    }
    return this.requestDict(ar, this.getContentEl(), this.textLang, triggerMethod);
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
        let textEl = this.getContentEl();
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
    }
  }

  onMouseup($event) {
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

  private setupSentenceIdMap() {
    if (this.contentSentenceMap != null) {
      return;
    }
    this.contentSentenceMap = new Map<string, Element>();
    let contentEl = this.getContentEl();
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

    let contentEl = this.getContentEl();
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

    let contentEl = this.getContentEl();

    let selector = HighlightGroups.HighlightSelectors;

    let annEls = contentEl.querySelectorAll(selector);
    for (let annEl of annEls) {
      this.highlightAssociatedWords(annEl, contentEl);
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

    this.annotationHoverSetup = true;
  }

  private setupHovers() {
    this.setupSentenceHover();
    this.setupAssociationHover();
    this.setupAnnotationsPopup();
  }

  ngOnChanges(changes: SimpleChanges) {
    let textChanged = false;
    if (changes.content) {
      this.getContentEl().innerHTML = this.content || ' ';
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
