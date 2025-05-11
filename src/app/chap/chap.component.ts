import { Component, ComponentFactoryResolver } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { SuiModalService } from 'ng2-semantic-ui';
import { Book } from '../models/book';
import { Chap } from '../models/chap';
import { Para } from '../models/para';
import { BookService } from '../services/book.service';
import { ChapService } from '../services/chap.service';
import { AnnotationsService } from '../services/annotations.service';
import { PopupDictSupportComponent } from '../dict/popup-dict-support.component';
import { UserVocabularyService } from '../services/user-vocabulary.service';
import { DictZhService } from '../services/dict-zh.service';
import { ParaCommentsExtModal } from '../content/para-comments-ext.component';
import { ParaService } from '../services/para.service';

@Component({
  selector: 'chap-detail',
  templateUrl: './chap.component.html',
  styleUrls: ['./chap.component.css']
})
export class ChapComponent extends PopupDictSupportComponent {
  book: Book;
  chap: Chap;
  selectedPara: Para;
  showCommentsCount = true;

  allowSwitchChap = true;
  loadBookDetail = true;
  prevChap: Chap;
  nextChap: Chap;

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
              protected modalService: SuiModalService) {
    super(annoService, vocabularyService, dictZhService, resolver);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        this.chapService.getDetail(params.get('id')))
    ).subscribe(chap => {
      if (!chap) {
        return;
      }
      if (!chap.paras) {
        chap.paras = [];
      } else {
        for (let para of chap.paras) {
          para.chap = chap;
        }
      }
      this.chap = chap;
      this.onChapChanged(chap);
      (this.loadBookDetail ? this.bookService.getDetail(chap.bookId)
        : this.bookService.getOne(chap.bookId))
        .subscribe(book => {
          chap.book = book;
          this.book = book;
          this.onBookChanged(book);
        });
      this.checkCommentsCount();
    });
  }

  protected setupNavigation(scrollChapList = true) {
    this.prevChap = null;
    this.nextChap = null;
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
    if (ci > 0) {
      this.prevChap = chaps[ci - 1];
    }
    if (ci < chaps.length - 1) {
      this.nextChap = chaps[ci + 1];
    }
    if (scrollChapList) {
      this.doScrollChapList(ci);
    }
  }

  protected doScrollChapList(chapIndex) {
  }

  protected onBookChanged(book: Book) {
    super.onBookChanged(book);
    if (this.allowSwitchChap) {
      this.setupNavigation();
    }
  }

  protected onChapChanged(chap: Chap) {
    window.history.pushState({}, '', `chaps/${chap.id}`);
  }

  selectPara(para): void {
    if (this.selectedPara === para) {
      return;
    }
    this.selectedPara = para;
  }

  selectPara2(para): void {
    if (this.selectedPara === para) {
      this.selectedPara = null;
      return;
    }
    this.selectPara(para);
  }

  paraTracker(index, para) {
    return para._id;
  }

  goBack(): void {
    // this.location.back();
    this.router.navigate(['books', this.book.id]);
  }


  protected checkCommentsCount() {
    if (!this.showCommentsCount) {
      return;
    }
    let chap = this.chap;
    if (chap && !chap.paraCommentsCountLoaded) {
      this.chapService.loadCommentsCount(chap).subscribe();
    }
  }

  protected doShowComments(para) {
    this.selectPara(para);
    this.modalService
      .open(new ParaCommentsExtModal(para));
  }

  showComments(para) {
    if (para.commentsCount === 0) {
      return;
    }
    if (para.comments) {
      this.doShowComments(para);
    } else {
      this.paraService.loadComments(para)
        .subscribe(cs => {
          this.doShowComments(para);
        });
    }
  }

}
