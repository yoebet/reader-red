import {
  OnChanges, Input, SimpleChanges,
  Component, ViewChild, ViewContainerRef,
  ComponentFactoryResolver, ComponentFactory, ComponentRef
} from '@angular/core';

import Drop from 'tether-drop'

import {HighlightGroups} from '../anno/annotations';

import {WordAnnosComponent} from './word-annos.component'

@Component({
  selector: 'para-content',
  templateUrl: './para-content.component.html',
  styleUrls: ['./para-content.component.css']
})
export class ParaContentComponent implements OnChanges {
  @ViewChild('contentText', {read: ViewContainerRef}) contentText: ViewContainerRef;
  @ViewChild('paraTrans', {read: ViewContainerRef}) paraTrans: ViewContainerRef;
  @ViewChild('wordAnnos', {read: ViewContainerRef}) wordAnnos: ViewContainerRef;
  @Input() content: string;
  @Input() trans: string;
  @Input() showTrans: boolean;
  @Input() gotFocus: boolean;
  @Input() highlightSentence: boolean;
  @Input() annotatedWordsHover: boolean;
  transRendered = false;
  sentenceHoverSetup = false;
  associatedWordsHoverSetup = false;
  annotatedWordsHoverSetup = false;
  highlightedSentences: Element[];
  highlightedWords: Element[];
  wordsPopupMap = new Map<Element, Drop>();
  wordAnnosComponentRef: ComponentRef<WordAnnosComponent>;

  static annotationTagName = 'y-o';
  static sentenceTagName = 's-st';
  static highlightClass = 'highlight';
  static dropClassPrefix = 'drop-';
  static highlightWordsSelector = HighlightGroups.highlightAnnotationSelectors;

  constructor(private resolver: ComponentFactoryResolver) {
  }

  onMouseup($event) {
    if (!this.gotFocus) {
      return;
    }
    $event.stopPropagation();
    // TODO:
  }


  private clearSentenceHighlights() {
    let hls = this.highlightedSentences;
    if (!hls) {
      return;
    }
    while (hls.length > 0) {
      let hl = hls.pop();
      hl.classList.remove(ParaContentComponent.highlightClass);
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
      hl.classList.remove(ParaContentComponent.highlightClass);
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
      let sentenceEls = textEl.querySelectorAll(ParaContentComponent.sentenceTagName);
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
          tsEl.classList.add(ParaContentComponent.highlightClass);
          if (!component.highlightedSentences) {
            component.highlightedSentences = [];
          }
          component.highlightedSentences.push(tsEl);
        }
      }
    };

    for (let textEl of [contentEl, transEl]) {
      let sentenceEls = textEl.querySelectorAll(ParaContentComponent.sentenceTagName);
      for (let sentenceEl of sentenceEls) {
        sentenceEl.addEventListener('mouseover', sentenceMouseover);
      }
    }

    this.sentenceHoverSetup = true;
  }

  private findSentence(node): any {
    let contentTextEl = this.contentText.element.nativeElement;
    let sentenceSelector = ParaContentComponent.sentenceTagName;
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
        annEl.classList.add(ParaContentComponent.highlightClass);
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

    if (this.associatedWordsHoverSetup || !this.gotFocus) {
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
      return wacr.location.nativeElement;
    };
    let drop = new Drop({
      target: wordEl,
      content: content,
      classes: `${ParaContentComponent.dropClassPrefix}anno`,
      position: 'bottom center',
      constrainToScrollParent: false,
      remove: true,
      hoverOpenDelay: 100,
      openOn: 'hover'//click,hover,always
    });

    this.wordsPopupMap.set(wordEl, drop);
  }


  private setupAnnotatedWordsHover() {

    if (this.annotatedWordsHoverSetup || !this.annotatedWordsHover || !this.gotFocus) {
      return;
    }

    this.wordsPopupMap.clear();

    let contentEl = this.contentText.element.nativeElement;
    let annEls = contentEl.querySelectorAll(ParaContentComponent.annotationTagName);
    for (let annEl of annEls) {
      this.showAnnotationsHover(annEl);
    }

    this.annotatedWordsHoverSetup = true;
  }

  refreshContent() {
    let html = this.content || ' ';
    html = `<div class="part">${html}</div>`;
    this.contentText.element.nativeElement.innerHTML = html;
  }

  refreshTrans() {
    let html = this.trans || ' ';
    html = `<div class="part">${html}</div>`;
    this.paraTrans.element.nativeElement.innerHTML = html;
    this.transRendered = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.trans) {
      this.transRendered = false;
    }
    if (this.showTrans && !this.transRendered) {
      this.refreshTrans();
      this.sentenceHoverSetup = false;
    }
    if (changes.content) {
      this.refreshContent();
      this.sentenceHoverSetup = false;
      this.associatedWordsHoverSetup = false;
      this.annotatedWordsHoverSetup = false;
    }

    if (this.highlightedSentences && (!this.gotFocus || !this.sentenceHoverSetup || !this.highlightSentence)) {
      this.clearSentenceHighlights();
    }
    if (this.highlightedWords && (!this.gotFocus || changes.content)) {
      this.clearWordHighlights();
    }

    if (this.gotFocus) {
      this.setupSentenceHover();
      this.setupAssociatedWordsHover();
      this.setupAnnotatedWordsHover();
    }
  }
}
