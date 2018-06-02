import {Component, OnInit} from '@angular/core';

import * as moment from 'moment';
import {groupBy, sortBy} from 'lodash';

import {UserWord} from '../models/user-word';
import {DictEntry} from '../models/dict-entry';
import {VocabularyService} from '../services/vocabulary.service';
import {DictService} from '../services/dict.service';
import {ChapService} from '../services/chap.service';

@Component({
  selector: 'vocabulary-main',
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.css']
})
export class VocabularyComponent implements OnInit {
  userWords: UserWord[];
  entry: DictEntry;
  searching = false;

  filteredUserWords: UserWord[];
  groupedUserWords: any[];
  familiarities = UserWord.Familiarities;

  filter: any = {
    familiarityAll: true,
    addOn: 'All'
  };
  grouping: any = {groupBy: ''};

  phrase = false;
  phraseOnly = false;
  wordScope = 'All';

  dictSearch = (key: string) => {
    let options = {
      phrase: this.phrase && !this.phraseOnly,
      phraseOnly: this.phraseOnly
    };
    for (let category of ['basic', 'cet', 'gre']) {
      if (this.wordScope === category) {
        options[category] = true;
        break;
      }
    }
    let o = this.dictService.search(key.trim(), options);
    return o.toPromise();
  };


  constructor(private vocaService: VocabularyService,
              private dictService: DictService,
              private chapService: ChapService) {
  }

  ngOnInit() {
    this.refreshWordList();
  }

  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  get latestAdded(): UserWord[] {
    return this.vocaService.latestAdded;
  }

  clearHistory() {
    this.dictService.clearHistory();
  }


  selectHistoryEntry(entry) {
    this.entry = entry;
    /*    this.vocaService.getOne(entry.word)
          .subscribe(userWord => {
            this.selectedWord = userWord;
          });*/
  }

  selectWord(uw) {
    // this.selectedWord = uw;
    this.dictService.getEntry(uw.word)
      .subscribe(entry => {
        this.entry = entry;
      });
  }

  /*  onUserWordRemoved(userWord) {
      if (userWord === this.selectedWord) {
        this.selectedWord = null;
      }
    }*/


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
        UserWord.ensureCreatedDate(userWord);
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
          group.title = '- Other';
        }
        this.groupedUserWords.push(group);
      }
      sortBy(this.groupedUserWords, ['bookId', 'chap.no']);
    } else if (gb === 'AddOn') {
      for (let userWord of this.filteredUserWords) {
        UserWord.ensureCreatedDate(userWord);
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

  selectResultItem(entrySimple) {
    this.dictService.getEntry(entrySimple.word)
      .subscribe(e => this.entry = e);
  }
}
