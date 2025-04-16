import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { Book } from '../models/book';
import { Chap } from '../models/chap';
import { Para } from '../models/para';
import { BookService } from '../services/book.service';
import { ChapService } from '../services/chap.service';
import { AnnotationsService } from '../services/annotations.service';
import { PopupDictSupportComponent } from '../dict/popup-dict-support.component';
import { UserVocabularyService } from '../services/user-vocabulary.service';
import { DictZhService } from '../services/dict-zh.service';
import { SuiModalService } from 'ng2-semantic-ui';
import { ParaCommentsExtModal } from '../content/para-comments-ext.component';
import { ParaService } from '../services/para.service';

@Component({
  selector: 'chap-detail',
  templateUrl: './chap.component.html',
  styleUrls: ['./chap.component.css']
})
export class ChapComponent extends PopupDictSupportComponent implements OnInit {
  book: Book;
  chap: Chap;
  selectedPara: Para;

  constructor(private bookService: BookService,
              private chapService: ChapService,
              private paraService: ParaService,
              private route: ActivatedRoute,
              private location: Location,
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
      this.bookService.getOne(chap.bookId)
        .subscribe(book => {
          chap.book = book;
          this.book = book;
          this.onBookChanged(book);
        });
      this.checkCommentsCount();
    });
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
    this.location.back();
  }


  private checkCommentsCount() {
    if (!this.showCommentsCount) {
      return;
    }
    let chap = this.chap;
    if (chap && !chap.paraCommentsCountLoaded) {
      this.chapService.loadCommentsCount(chap).subscribe();
    }
  }

  private doShowComments(para) {
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
