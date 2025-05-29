import { Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SuiSidebar } from 'ng2-semantic-ui/dist';
import { SuiModalService } from 'ng2-semantic-ui';

import { LocalStorageKey, ReaderStyles } from '../config';
import { Book } from '../models/book';
import { Chap } from '../models/chap';
import { UserWord } from '../models/user-word';
import { DictEntry } from '../models/dict-entry';
import { BookService } from '../services/book.service';
import { ChapService } from '../services/chap.service';
import { ParaService } from '../services/para.service';
import { DictZhService } from '../services/dict-zh.service';
import { AnnotationsService } from '../services/annotations.service';
import { UserVocabularyService } from '../services/user-vocabulary.service';
import { ReaderHelperModal } from './reader-helper.component';
import { ChapComponent } from './chap.component';
import { Location } from '@angular/common';
import { DictService } from '../services/dict.service';
import { UserWordService } from '../services/user-word.service';
import { DictRequest } from '../content-types/dict-request';
import { SessionService } from '../services/session.service';
import { LoginModal } from '../user/account/login-popup.component';


@Component({
  selector: 'chap-reader',
  templateUrl: './chap-reader.component.html',
  styleUrls: ['./chap-reader.component.css']
})
export class ChapReaderComponent extends ChapComponent implements OnInit, OnDestroy {
  @ViewChild('sidebar', { read: SuiSidebar }) sidebar: SuiSidebar;
  chapListScrolled = false;

  sidebarContent: 'vocabulary'|'chap-list' = 'vocabulary';

  readerBgCssClass = ReaderStyles.ReaderBgDefault;
  readerBgCandidates = ReaderStyles.ReaderBgCandidates;

  loadBookDetail = true;
  prevChap: Chap;
  nextChap: Chap;

  get currentUser() {
    return this.sessionService.currentUser;
  }

  constructor(protected bookService: BookService,
              protected chapService: ChapService,
              protected paraService: ParaService,
              protected route: ActivatedRoute,
              protected router: Router,
              protected location: Location,
              protected annoService: AnnotationsService,
              protected vocabularyService: UserVocabularyService,
              protected dictZhService: DictZhService,
              protected resolver: ComponentFactoryResolver,
              protected modalService: SuiModalService,
              protected dictService: DictService,
              protected userWordService: UserWordService,
              protected sessionService: SessionService,
  ) {
    super(bookService, chapService, paraService, route, router, location, annoService,
      vocabularyService, dictZhService, resolver, modalService);

    const LSK = LocalStorageKey;
    let storage = window.localStorage;
    let readerBg = storage.getItem(LSK.readerBG);
    if (readerBg) {
      this.readerBgCssClass = readerBg;
    }
    this.lookupDict = this.getStorageBoolean(storage, LSK.readerLookupDict, this.lookupDict);
    this.markNewWords = this.getStorageBoolean(storage, LSK.readerMarkNewWords, this.markNewWords);
    this.annotationHover = this.getStorageBoolean(storage, LSK.readerAnnotationHover, this.annotationHover);
    this.showTrans = this.getStorageBoolean(storage, LSK.readerShowTrans, this.showTrans);
    this.leftRight = this.getStorageBoolean(storage, LSK.readerLeftRight, this.leftRight);
  }

  ngOnInit(): void {
    this.sessionService.checkLogin().subscribe(cu => {
      if (cu) {
        super.ngOnInit();
        return;
      } else {
        this.openLoginDialog();
      }
    });
  }

  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  get latestAdded(): UserWord[] {
    return this.userWordService.latestAdded;
  }


  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy(): void {

    let storage = window.localStorage;

    const LSK = LocalStorageKey;
    storage.setItem(LSK.readerBG, this.readerBgCssClass);
    storage.setItem(LSK.readerLookupDict, this.lookupDict ? '1' : '0');
    storage.setItem(LSK.readerMarkNewWords, this.markNewWords ? '1' : '0');
    storage.setItem(LSK.readerAnnotationHover, this.annotationHover ? '1' : '0');
    storage.setItem(LSK.readerShowTrans, this.showTrans ? '1' : '0');
    storage.setItem(LSK.readerLeftRight, this.leftRight ? '1' : '0');
  }

  gotoPercent(percent: number) {
    if (!this.chap) {
      return;
    }
    let paras = this.chap.paras;
    if (!paras || paras.length === 0) {
      return;
    }
    let pn = Math.round(paras.length * percent / 100.0);
    if (pn === 0) {
      pn = 1;
    } else if (pn > paras.length) {
      pn = paras.length;
    }
    this.selectedPara = paras[pn - 1];
    this.selectPno(pn);
  }

  private selectPno(pn) {
    let paraEl = document.querySelector(`.item.paragraph.chap_p${pn}`);
    if (paraEl) {
      paraEl.scrollIntoView({ block: 'center' });
    }
  }

  protected onChapChanged(chap) {
    // if (this.book) {
    //   chap.book = this.book;
    // }
    // if (!chap.paras) {
    //   chap.paras = [];
    //   return;
    // }
    // for (let para of chap.paras) {
    //   para.chap = chap;
    // }
  }

  protected doScrollChapList(chapIndex) {
    let selector = `.chap-list a.item.chap_title${chapIndex}`;
    let chapTitleEl = document.querySelector(selector);
    if (!chapTitleEl) {
      setTimeout(() => {
        chapTitleEl = document.querySelector(selector);
        if (chapTitleEl) {
          chapTitleEl.scrollIntoView({ block: 'center' });
          this.chapListScrolled = true;
        }
      }, 50);
      return;
    }
    chapTitleEl.scrollIntoView({ block: 'center' });
    this.chapListScrolled = true;
  }

  switchChap(chap: Chap, scrollChapList = true) {
    if (!chap) {
      return;
    }
    if (!this.allowSwitchChap) {
      return;
    }
    if (this.chap && chap._id === this.chap._id) {
      return;
    }
    this.chapService.getDetail(chap._id)
      .subscribe(chapDetail => {
        this.chap = chapDetail;
        this.onChapChanged(chapDetail);
        window.history.pushState({}, '', `m/${chap.id}`);
        if (scrollChapList) {
          this.chapListScrolled = false;
        }
        this.setupNavigation(scrollChapList);
        this.checkCommentsCount();
      });
  }

  toggleSidebar(sidebar: SuiSidebar, which) {
    if (sidebar.isVisible) {
      if (this.sidebarContent === which) {
        sidebar.close();
        return;
      }
      this.sidebarContent = which;
      return;
    }
    this.sidebarContent = which;
    sidebar.open();
    if (which === 'chap-list') {
      if (this.chapListScrolled) {
        return;
      }
      if (!this.book) {
        return;
      }
      let chaps = this.book.chaps;
      if (!chaps || chaps.length === 0) {
        return;
      }
      let ci = chaps.findIndex(c => c._id === this.chap._id);
      if (ci === -1) {
        return;
      }
      this.doScrollChapList(ci);
    }
  }

  showDictSimple2(el, entry) {
    const dr = new DictRequest();
    dr.dictLang = Book.LangCodeEn;
    dr.wordElement = el;
    dr.dictEntry = entry;
    dr.simplePopup = true;
    this.showDictSimple(dr);
  }

  lookupUserWord($event, uw) {
    let el = $event.target;
    this.dictService.getEntry(uw.word, { pushHistory: false })
      .subscribe(entry => {
        this.showDictSimple2(el, entry);
      });
  }

  showEntryPopup($event, entry) {
    this.showDictSimple2($event.target, entry);
  }

  clearDictLookupHistory() {
    this.dictService.clearHistory();
  }

  showHelper() {
    this.modalService.open(new ReaderHelperModal());
  }

  setBackground(cssClass: string) {
    this.readerBgCssClass = cssClass;
  }

  openLoginDialog() {
    this.modalService.open(new LoginModal('请登录')).onApprove(r => {
      window.location = window.location;
    });
  }

}
