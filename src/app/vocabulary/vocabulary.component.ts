import {Component, OnInit} from '@angular/core';

import {UserWord} from '../models/user_word';
import {DictEntry} from '../models/dict-entry';
import {VocabularyService} from '../services/vocabulary.service';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'vocabulary-main',
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.css']
})
export class VocabularyComponent implements OnInit {
  userWords: UserWord[];
  selectedWord: UserWord;
  entry: DictEntry;

  constructor(private vocaService: VocabularyService, private dictService: DictService) {
  }

  getList() {
    this.vocaService.list().subscribe(allWords => {
      this.userWords = allWords;
    });
  }

  ngOnInit() {
    this.getList();
  }

  selectWord(uw) {
    this.selectedWord = uw;
    this.dictService.getEntry(uw.word)
      .subscribe(entry => {
        this.entry = entry;
      });
  }

  onUserWordRemoved(userWord) {
    if (userWord === this.selectedWord) {
      this.getList();
      this.selectedWord = null;
    }
  }

}
