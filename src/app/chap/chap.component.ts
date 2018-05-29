import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Location} from '@angular/common';
import 'rxjs/add/operator/switchMap';
import Tether from 'tether';

import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {Para} from '../models/para';
import {AnnotationSet} from '../anno/annotation-set';
import {BookService} from '../services/book.service';
import {ChapService} from '../services/chap.service';
import {AnnotationFamilyService} from "../services/annotation-family.service";
import {DictRequest} from './dict-request';

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
  leftRight = false;
  highlightSentence = false;
  annotatedWordsHover = true;
  lookupDict = false;

  annotationSet: AnnotationSet;

  dictRequest: DictRequest = null;
  dictTether = null;
  private tetherClassPrefix = 'dp';

  constructor(private bookService: BookService,
              private chapService: ChapService,
              private annoService: AnnotationFamilyService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  ngOnInit(): void {
    this.route.paramMap.switchMap((params: ParamMap) =>
      this.chapService.getDetail(params.get('id'))
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

    document.addEventListener('click', (event) => {
      if (this.dictRequest && this.dictTether) {
        let dictPopup = document.getElementById('dictPopup');
        if (event.target) {
          let node = event.target as Node;
          if (this.dictRequest.wordElement === node) {
            return;
          }
          if (dictPopup.contains(node)) {
            return;
          }
        }
        this.closeDictPopup();
      }
    }, true)
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

  onAnnotatedWordsHoverChange() {
    let bodyClasses = document.body.classList;
    let className = 'drop-anno-disabled';
    if (this.annotatedWordsHover) {
      bodyClasses.remove(className);
    } else {
      bodyClasses.add(className);
    }
  }

  private removeTetherClass(el) {
    el.className = el.className.split(' ')
      .filter(n => !n.startsWith(this.tetherClassPrefix + '-')).join(' ');
    if (el.className === '') {
      el.removeAttribute('class');
    }
  }

  private closeDictPopup() {
    if (this.dictRequest) {
      this.dictRequest.onClose();
      if (this.dictTether) {
        this.dictTether.destroy();
        this.dictTether = null;
      }
      let el = this.dictRequest.wordElement;
      this.removeTetherClass(el);
      this.dictRequest = null;
    }
  }

  onDictRequest(dictRequest) {
    if (this.dictRequest) {
      if (this.dictRequest.wordElement === dictRequest.wordElement) {
        this.closeDictPopup();
        return;
      } else {
        this.closeDictPopup();
      }
    }
    this.dictRequest = dictRequest;
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
        attachment: 'top center',
        targetAttachment: 'bottom center',
        constraints: [
          {
            to: 'window',
            attachment: 'together'
          }
        ],
        classPrefix: this.tetherClassPrefix
      });
    }
  }

  paraTracker(index, para) {
    return para._id;
  }

  goBack(): void {
    this.location.back();
  }

}
