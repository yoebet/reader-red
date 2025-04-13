import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';

import { UIConstants } from '../config';
import { Book } from '../models/book';
import { Chap } from '../models/chap';
import { Para } from '../models/para';
import { AnnotationSet } from '../anno/annotation-set';
import { BookService } from '../services/book.service';
import { ChapService } from '../services/chap.service';
import { AnnotationsService } from '../services/annotations.service';
import { PopupDictSupportComponent } from '../dict/popup-dict-support.component';

@Component({
  selector: 'chap-detail',
  templateUrl: './chap.component.html',
  styleUrls: ['./chap.component.css']
})
export class ChapComponent extends PopupDictSupportComponent implements OnInit {
  book: Book;
  chap: Chap;
  selectedPara: Para;
  showTrans = true;
  leftRight = true;
  highlightSentence = true;
  annotatedWordsHover = true;
  markNewWords = true;
  lookupDict = false;


  constructor(private bookService: BookService,
              private chapService: ChapService,
              private route: ActivatedRoute,
              private location: Location,
              protected annoService: AnnotationsService) {
    super(annoService);
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
          this.loadAnnotations();
        });
    });
  }

  private loadAnnotations() {
    let afId = this.book.annotationFamilyId;
    if (!afId) {
      return;
    }
    this.annoService.getAnnotationSet(afId)
      .subscribe((annotationSet: AnnotationSet) => {
        if (!annotationSet) {
          return;
        }
        this.annotationSet = annotationSet;
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

  private toggleBodyClass(className: string, flag: boolean) {
    let bodyClasses = document.body.classList;
    if (flag) {
      bodyClasses.remove(className);
    } else {
      bodyClasses.add(className);
    }
  }

  onMarkNewWordsChange() {
    this.toggleBodyClass(UIConstants.newwordDisabledBodyClass, this.markNewWords);
  }

  onAnnotatedWordsHoverChange() {
    this.toggleBodyClass(UIConstants.annoDisabledBodyClass, this.annotatedWordsHover);
  }

  paraTracker(index, para) {
    return para._id;
  }

  goBack(): void {
    this.location.back();
  }

}
