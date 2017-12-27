import {Component, Input, OnInit} from '@angular/core';
import 'rxjs/add/operator/switchMap';

import {Chap} from '../models/chap';
import {Para} from '../models/para';


@Component({
  selector: 'chap-paras',
  templateUrl: './chap-paras.component.html',
  styleUrls: ['./chap-paras.component.css']
})
export class ChapParasComponent implements OnInit {
  @Input() chap: Chap;
  selectedPara: Para;
  showTrans = false;
  highlightSentence = false;
  annotatedWordsHover = true;


  ngOnInit(): void {
    if (!this.chap.paras) {
      this.chap.paras = [];
    }
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

}
