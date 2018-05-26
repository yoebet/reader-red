import {Component} from '@angular/core';

import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'word-meanings',
  templateUrl: './word-meanings.component.html',
  styleUrls: ['./word-meanings.component.css']
})
export class WordMeaningsComponent {

  private _word: string;
  entry: DictEntry;


  constructor(private dictService: DictService) {
  }

  get word() {
    return this._word;
  }

  set word(word) {
    this._word = word;
    this.dictService.getEntry(word, {simple: true})
      .subscribe((entry: DictEntry) => {
        this.entry = entry;
      });
  }
}
