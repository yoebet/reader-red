import {Component, OnInit} from '@angular/core';

import * as moment from 'moment';
import {groupBy, sortBy} from 'lodash';

import {Model} from '../models/model';
import {UserWord} from '../models/user_word';
import {DictEntry} from '../models/dict-entry';
import {VocabularyService} from '../services/vocabulary.service';
import {DictService} from '../services/dict.service';
import {BookService} from '../services/book.service';
import {ChapService} from '../services/chap.service';
import {ParaService} from '../services/para.service';

@Component({
  selector: 'vocabulary-main',
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.css']
})
export class VocabularyComponent implements OnInit {
  userWords: UserWord[];
  selectedWord: UserWord;
  entry: DictEntry;

  filteredUserWords: UserWord[];
  groupedUserWords: any[];

  familiarities = UserWord.familiarities;

  filter: any = {
    familiarityAll: true,
    addOn: '1.weeks'
  };

  grouping: any = {groupBy: ''};

  constructor(private vocaService: VocabularyService,
              private dictService: DictService,
              private bookService: BookService,
              private chapService: ChapService,
              private paraService: ParaService) {
  }

  ngOnInit() {
    this.refreshWordList();
  }

  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  clearHistory() {
    this.dictService.clearHistory();
  }


  selectHistoryEntry(entry) {
    this.entry = entry;
    this.vocaService.getOne(entry.word)
      .subscribe(userWord => {
        this.selectedWord = userWord;
      });
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
      this.selectedWord = null;
    }
  }

  ensureCreatedDate(userWord) {
    if (userWord.createdMoment) {
      return;
    }
    let createdDate = Model.timestampOfObjectId(userWord._id);
    userWord.createdMoment = moment(createdDate);
    let date = userWord.createdMoment;
    let dayOfWeek = date.day();
    let weekOfYear = date.week();
    let dayOfMonth = date.date();//1-31
    let month = date.month();//0-11
    let year = date.year();
    let dateString = `${year}-${month + 1}-${dayOfMonth}`;
    userWord.createdDateParts = {year, month, dayOfMonth, weekOfYear, dayOfWeek, dateString};
  }

  private filterUserWords() {
    this.filteredUserWords = [];
    let filter = this.filter;
    let fromThen;
    if (filter.addOn !== 'All') {
      let dp = filter.addOn.split('.');
      let n = parseInt(dp[0]);
      let part = dp[1];
      let now = moment();
      fromThen = now.subtract(n, part);
    }
    for (let userWord of this.userWords) {
      if (!filter.familiarityAll) {
        let fam = userWord.familiarity;
        if (!filter['familiarity' + fam]) {
          continue;
        }
      }
      if (filter.addOn !== 'All') {
        this.ensureCreatedDate(userWord);
        if (userWord.createdMoment.isBefore(fromThen)) {
          continue;
        }
      }
      this.filteredUserWords.push(userWord);
    }
  }

  private groupUserWords() {
    this.groupedUserWords = [];
    let gb = this.grouping.groupBy;
    if (!gb) {
      let group: any = {key: '-', title: 'All', userWords: this.filteredUserWords};
      this.groupedUserWords.push(group);
      return;
    }
    if (gb === 'Source') {
      // let grouped = groupBy(this.filteredUserWords, 'bookId');
      // for (let bookId in grouped) {
      //   let userWords = grouped[bookId];
      //   let group: any = {key: bookId, userWords};
      //   if (bookId && bookId !== 'null') {
      //     this.bookService.getOne(bookId)
      //       .subscribe(book => {
      //         if (!book) {
      //           group.title = '-';
      //           return;
      //         }
      //         group.title = book.name;
      //         group.book = book;
      //       });
      //   } else {
      //     group.title = '-';
      //   }
      //   this.groupedUserWords.push(group);
      // }
      let grouped = groupBy(this.filteredUserWords, 'chapId');
      for (let chapId in grouped) {
        let userWords = grouped[chapId];
        let group: any = {key: chapId, userWords};
        if (chapId && chapId !== 'null') {
          this.chapService.getOne(chapId)
            .subscribe(chap => {
              if (!chap) {
                group.title = '-';
                return;
              }
              group.chap = chap;
              group.bookId = chap.bookId;
              group.title = chap.name;
              if (group.title.length > 90) {
                group.title = group.title.substring(0, 90) + '...';
              }
            });
        } else {
          group.title = '-';
        }
        this.groupedUserWords.push(group);
      }
      sortBy(this.groupedUserWords, ['bookId', 'chap.no']);
    } else if (gb === 'AddOn') {
      for (let userWord of this.filteredUserWords) {
        this.ensureCreatedDate(userWord);
      }
      let grouped = groupBy(this.filteredUserWords, 'createdDateParts.dateString');
      for (let dateString in grouped) {
        let userWords = grouped[dateString];
        let group: any = {key: dateString, title: dateString, userWords};
        this.groupedUserWords.push(group);
      }
      this.groupedUserWords = sortBy(this.groupedUserWords, group => {
        let userWord = group.userWords[0];
        return userWord.createdMoment.unix();
      });
    }
  }

  refreshWordList() {
    this.vocaService.list().subscribe(allWords => {
      this.userWords = allWords;
      this.filterUserWords();
      this.groupUserWords();
    });
  }

}
