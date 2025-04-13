import { OnInit } from '@angular/core';
import { UIConstants } from '../config';
import { DictRequest } from '../chap/dict-request';
import { AnnotationsService } from '../services/annotations.service';
import { AnnotationSet } from '../anno/annotation-set';
import * as Tether from 'tether';


export abstract class PopupDictSupportComponent implements OnInit {

  annotationSet = new AnnotationSet([]);
  dictRequest: DictRequest = null;
  dictTether = null;

  protected constructor(protected annotationsService: AnnotationsService) {
  }

  ngOnInit() {
    this.annotationsService.getDefaultAnnotationSet()
      .subscribe(annoSet => {
        if (annoSet) {
          this.annotationSet = annoSet;
        }
      });

    document.addEventListener('click', (event) => {
      if (this.dictRequest && this.dictTether) {
        let dictPopup = document.getElementById('dictPopup');
        if (event.target) {
          let target = event.target as Element;
          if (target.contains(this.dictRequest.wordElement)) {
            if (target.closest(`${UIConstants.sentenceTagName}, .para-text, .paragraph`)) {
              return;
            }
          }
          if (dictPopup.contains(target)) {
            return;
          }
        }
        this.closeDictPopup();
      }
    }, true);
  }


  private removeTetherClass(el) {
    el.className = el.className.split(' ')
      .filter(n => !n.startsWith(UIConstants.tetherClassPrefix)).join(' ');
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
        classPrefix: UIConstants.tetherClassPrefixNoHyphen
      });
    }
  }
}
