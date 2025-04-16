import { ComponentFactory, ComponentFactoryResolver, ComponentRef, HostListener, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import * as Tether from 'tether';
import * as Drop from 'tether-drop';
import { UIConstants } from '../config';
import { DictRequest, SelectedItem, UserWordChange } from '../content-types/dict-request';
import { AnnotationsService } from '../services/annotations.service';
import { AnnotationSet } from '../anno/annotation-set';
import { ContentContext } from '../content-types/content-context';
import { DictSimpleComponent } from './dict-simple.component';
import { DictEntry } from '../models/dict-entry';
import { AnnotatorHelper } from '../anno/annotator-helper';
import { UserVocabularyService } from '../services/user-vocabulary.service';
import { Book } from '../models/book';
import { DictZhService } from '../services/dict-zh.service';


export abstract class PopupDictSupportComponent implements OnInit {
  @ViewChild('dictSimple', { read: ViewContainerRef }) dictSimple: ViewContainerRef;
  showTrans = true;
  leftRight = true;
  highlightSentence = true;
  annotationHover = true;
  markNewWords = true;
  lookupDict = false;
  loadZhPhrases = false;
  showCommentsCount = true;

  contentContext: ContentContext;

  dictRequest: DictRequest = null;
  dictTether = null;

  simpleDictRequest: DictRequest = null;
  simpleDictDrop: Drop;
  simpleDictComponentRef: ComponentRef<DictSimpleComponent>;

  protected constructor(protected annoService: AnnotationsService,
                        protected vocabularyService: UserVocabularyService,
                        protected dictZhService: DictZhService,
                        protected resolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
    if (!this.contentContext) {
      this.contentContext = new ContentContext();
    }
    this.contentContext.combinedWordsMapObs = this.vocabularyService.getCombinedWordsMap();

    this.annoService.getDefaultAnnotationSet()
      .subscribe(annoSet => {
        if (annoSet) {
          this.contentContext.annotationSet = annoSet;
        }
      });
    if (this.loadZhPhrases) {
      this.dictZhService.getPhrases()
        .subscribe(ph => this.contentContext.zhPhrases = ph);
    }

    document.addEventListener('click', (event) => {
      if (!this.dictRequest || !this.dictTether) {
        return;
      }
      if (event.target) {
        let target = event.target as Element;
        if (target.contains(this.dictRequest.wordElement)) {
          if (target.closest(`${UIConstants.sentenceTagName}, .para-text, .paragraph`)) {
            return;
          }
        }
        let dictPopup = document.getElementById('dictPopup');
        if (dictPopup && dictPopup.contains(target)) {
          return;
        }
        if (target.closest('.ui.modal')) {
          return;
        }
      }
      this.onDictItemSelect(null);
      event.stopPropagation();
    }, true);

    // const LSK = LocalStorageKey;
    // let storage = window.localStorage;
    // this.lookupDict = this.getStorageBoolean(storage, LSK.readerLookupDict, this.lookupDict);
    // this.markNewWords = this.getStorageBoolean(storage, LSK.readerMarkNewWords, this.markNewWords);
    // this.annotationHover = this.getStorageBoolean(storage, LSK.readerAnnotationHover, this.annotationHover);
    // this.showTrans = this.getStorageBoolean(storage, LSK.readerShowTrans, this.showTrans);
    // this.leftRight = this.getStorageBoolean(storage, LSK.readerLeftRight, this.leftRight);
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent($event: KeyboardEvent) {
    // alert(`${$event.key} ${$event.code}`);
    if ($event.key === 'Escape') {
      if (this.dictRequest) {
        this.onDictItemSelect(null);
        $event.stopPropagation();
        return;
      }
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState($event: PopStateEvent) {
    if (this.dictRequest) {
      this.closeDictPopup();
    }
  }

  protected onBookChanged(book: Book) {
    if (!book) {
      return;
    }
    this.contentContext.contentLang = book.contentLang;
    this.contentContext.transLang = book.transLang;
    let afId = book.annotationFamilyId;
    if (!afId) {
      return;
    }
    this.annoService.getAnnotationSet(afId)
      .subscribe((annotationSet: AnnotationSet) => {
        if (!annotationSet) {
          return;
        }
        this.contentContext.annotationSet = annotationSet;
      });
  }

  private getStorageBoolean(storage, key, defaultValue: boolean): boolean {
    let value = storage.getItem(key);
    if (value == null) {
      return defaultValue;
    }
    return value === '1';
  }

  protected toggleBodyClass(className: string, flag: boolean) {
    let bodyClasses = document.body.classList;
    if (flag) {
      bodyClasses.remove(className);
    } else {
      bodyClasses.add(className);
    }
  }

  toggleMarkNewWords() {
    this.markNewWords = !this.markNewWords;
    this.toggleBodyClass(UIConstants.userwordDisabledBodyClass, this.markNewWords);
  }

  toggleAnnotationHover() {
    this.annotationHover = !this.annotationHover;
    this.toggleBodyClass(UIConstants.annoDisabledBodyClass, this.annotationHover);
  }


  private removeTetherClass(el) {
    el.className = el.className.split(' ')
      .filter(n => !n.startsWith(UIConstants.tetherClassPrefixNoHyphen + '-')).join(' ');
    if (el.className === '') {
      el.removeAttribute('class');
    }
  }

  private closeDictPopup() {
    if (this.dictRequest) {
      if (this.dictTether) {
        this.dictTether.destroy();
        this.dictTether = null;
      }
      let el = this.dictRequest.wordElement;
      this.removeTetherClass(el);
      this.dictRequest = null;
    }
  }

  onDictRequest(dictRequest: DictRequest) {
    if (this.dictRequest) {
      if (this.dictRequest.wordElement === dictRequest.wordElement) {
        this.onDictItemSelect(null);
        return;
      } else {
        // cancel
        this.onDictItemSelect(null);
      }
    }
    if (dictRequest && dictRequest.simplePopup) {
      this.showDictSimple(dictRequest);
    } else {
      this.dictRequest = dictRequest;
    }
  }

  onDictPopupReady() {
    if (!this.dictRequest) {
      return;
    }
    if (this.dictTether) {
      this.dictTether.position();
    } else {
      let dictPopup = document.getElementById('dictPopup');
      this.dictTether = new Tether({
        element: dictPopup,
        target: this.dictRequest.wordElement,
        targetAttachment: 'bottom right',
        attachment: 'top right',
        constraints: [
          {
            to: 'window',
            attachment: 'together',
            pin: true
          }
        ],
        classPrefix: UIConstants.tetherClassPrefixNoHyphen
      });
    }
  }

  onDictItemSelect(selected: SelectedItem) {
    if (!this.dictRequest) {
      return;
    }
    let dr = this.dictRequest;
    this.closeDictPopup();
    dr.meaningItemCallback(selected);
  }

  onUserWordChange(change: UserWordChange) {
    let dr = this.dictRequest;
    if (!dr) {
      return;
    }
    if (dr.userWordChangeCallback) {
      dr.userWordChangeCallback(change);
    }
  }

  private getSimpleDictComponentRef() {
    if (!this.simpleDictComponentRef) {
      let factory: ComponentFactory<DictSimpleComponent> = this.resolver.resolveComponentFactory(DictSimpleComponent);
      this.dictSimple.clear();
      this.simpleDictComponentRef = this.dictSimple.createComponent(factory);
    }
    return this.simpleDictComponentRef;
  }

  private showDictSimple(dictRequest: DictRequest) {
    if (!dictRequest) {
      return;
    }
    if (this.simpleDictRequest) {
      let el = this.simpleDictRequest.wordElement;
      if (el === dictRequest.wordElement) {
        return;
      }
    }

    let { dictEntry, wordElement } = dictRequest;
    let dscr = this.getSimpleDictComponentRef();
    // tslint:disable-next-line:only-arrow-functions
    let content = function () {
      dscr.instance.entry = dictEntry as DictEntry;
      return dscr.location.nativeElement;
    };

    setTimeout(() => {
      let lastDrop = this.simpleDictDrop;
      if (lastDrop) {
        lastDrop.close();
      }
      let drop = new Drop({
        target: wordElement,
        content,
        classes: `${UIConstants.dropClassPrefix}dict`,
        constrainToScrollParent: false,
        remove: true,
        openOn: 'click', // click,hover,always
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
      drop.open();
      drop.once('close', () => {
        AnnotatorHelper.removeDropTagIfDummy(wordElement);
        setTimeout(() => {
          drop.destroy();
        }, 10);
      });

      this.simpleDictRequest = dictRequest;
      this.simpleDictDrop = drop;
    }, 10);
  }
}
