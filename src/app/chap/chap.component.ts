import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Location} from '@angular/common';
import 'rxjs/add/operator/switchMap';

import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {Para} from '../models/para';
import {BookService} from '../services/book.service';
import {ChapService} from '../services/chap.service';

@Component({
  selector: 'chap-detail',
  templateUrl: './chap.component.html',
  styleUrls: ['./chap.component.css']
})
export class ChapComponent implements OnInit {
  book: Book;
  chap: Chap;
  selectedPara: Para;
  showTrans = false;
  highlightSentence = false;
  annotatedWordsHover = true;

  constructor(private bookService: BookService,
              private chapService: ChapService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  ngOnInit(): void {
    this.route.paramMap.switchMap((params: ParamMap) =>
      this.chapService.getDetail(params.get('id'))
    ).subscribe(chap => {
      if (!chap.paras) {
        chap.paras = [];
      }
      this.chap = chap;
      this.bookService.getOne(chap.bookId)
        .subscribe((book) => this.book = book);
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

  onAnnotatedWordsHoverChange() {
    let bodyClasses = document.body.classList;
    let className = 'drop-anno-disabled';
    if (this.annotatedWordsHover) {
      bodyClasses.remove(className);
    } else {
      bodyClasses.add(className);
    }
  }

  paraTracker(index, para) {
    return para._id;
  }

  goBack(): void {
    this.location.back();
  }

}
