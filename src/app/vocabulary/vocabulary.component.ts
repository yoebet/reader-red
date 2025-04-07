import {Component, OnInit, ViewChild} from '@angular/core';

import * as moment from 'moment';
import {groupBy, sortBy, shuffle, take, random} from 'lodash';

import {UserWord} from '../models/user-word';
import {DictEntry} from '../models/dict-entry';
import {UserWordService} from '../services/user-word.service';
import {DictService} from '../services/dict.service';
import {ChapService} from '../services/chap.service';
import {SuiSearch} from 'ng2-semantic-ui/dist/modules/search/components/search';
import {UserVocabularyService} from '../services/user-vocabulary.service';

@Component({
  selector: 'vocabulary-main',
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.css']
})
export class VocabularyComponent implements OnInit {
  @ViewChild('searchInput', {read: SuiSearch}) searchInput: SuiSearch<any>;
  userWords: UserWord[];
  entry: DictEntry;
  mode = 'userWords';

  filteredUserWords: UserWord[];
  groupedUserWords: any[];
  familiarities = UserWord.Familiarities;

  userWordsForCards: UserWord[];
  cardWords: { userWord: UserWord, entry?: DictEntry }[];
  cardsRandom = true;
  cardsOrder = 'none';
  cardsCount = 6;
  cardsOffset = 0;

  wordStatistic: Object;

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
    if (!this.phraseOnly) {
      for (let category of ['basic', 'cet', 'gre']) {
        if (this.wordScope === category) {
          options[category] = true;
          break;
        }
      }
    }
    let o = this.dictService.search(key.trim(), options);
    return o.toPromise();
  }


  constructor(private userWordService: UserWordService,
              private dictService: DictService,
              private chapService: ChapService,
              private userVocabularyService: UserVocabularyService) {
  }

  ngOnInit() {
    this.refreshWordList();
  }

  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  get latestAdded(): UserWord[] {
    return this.userWordService.latestAdded;
  }

  clearHistory() {
    this.dictService.clearHistory();
  }


  selectHistoryEntry(entry) {
    this.entry = entry;
  }

  selectWord(uw) {
    this.dictService.getEntry(uw.word)
      .subscribe(entry => {
        this.entry = entry;
      });
  }

  selectSearchResult(entrySimple) {
    this.dictService.getEntry(entrySimple.word)
      .subscribe(e => this.entry = e);
  }

  resetSearch() {
    this.searchInput.optionsLookup = this.dictSearch;
  }

  onKeyup($event) {
    if ($event.which !== 13) {
      return;
    }
    let searchInput = this.searchInput;
    let results = searchInput.results;
    let query = searchInput.query;
    for (let entry of results) {
      if (entry.word === query) {
        searchInput.select(entry);
        break;
      }
    }
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
              let title = chap.name;
              let truncate = 96;
              if (title.length > truncate) {
                for (let th = truncate - 16; truncate > th; truncate--) {
                  if (title.charAt(truncate) === ' ') {
                    break;
                  }
                }
                title = title.substring(0, truncate) + '...';
              }
              group.title = title;
            });
        } else {
          group.title = '- Other';
        }
        this.groupedUserWords.push(group);
      }
      this.groupedUserWords = sortBy(this.groupedUserWords, ['bookId', 'chap.no']);
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
    this.userWordService.list().subscribe(allWords => {
      this.userWords = allWords;
      this.filterUserWords();
      this.groupUserWords();
    });
  }

  clickStatistic() {
    this.mode = 'statistic';
    this.entry = null;
    this.userVocabularyService.statistic()
      .subscribe(statistic => {
        this.wordStatistic = statistic;
      });
  }

  generateCardWords() {
    this.userWordService.list().subscribe(allWords => {
      this.userWords = allWords;
      this.filterUserWords();
      this.userWordsForCards = this.filteredUserWords;


      if (!this.cardsRandom) {
        if (this.cardsOrder === 'addOn') {
          this.userWordsForCards = sortBy(this.userWordsForCards, userWord => {
            return -userWord.createdMoment.unix();
          });
        }
      }

      this.cardsOffset = 0;
      this.nextBatchCardWords();
    });

  }

  nextBatchCardWords() {
    this.cardWords = [];
    let userWords: UserWord[];

    let wordsLen = this.userWordsForCards.length;
    if (wordsLen === 0) {
      return;
    }

    if (this.cardsRandom) {
      userWords = this.userWordsForCards;
      if (wordsLen > this.cardsCount * 11) {
        let sliceFrom = random(wordsLen - this.cardsCount);
        userWords = userWords.slice(sliceFrom, sliceFrom + this.cardsCount);
      }
      userWords = shuffle(userWords);
      if (this.cardsCount < wordsLen) {
        userWords = take(userWords, this.cardsCount);
      }
    } else {
      if (this.cardsOffset >= wordsLen) {
        this.cardsOffset = 0;
      }
      let endOffset = Math.min(this.cardsOffset + this.cardsCount, wordsLen);
      userWords = this.userWordsForCards.slice(this.cardsOffset, endOffset);

      this.cardsOffset = endOffset;
    }

    for (let userWord of userWords) {
      let cardWord = {userWord, entry: null as DictEntry};
      this.cardWords.push(cardWord);
      this.dictService.getEntry(userWord.word)
        .subscribe(entry => {
          cardWord.entry = entry;
        });
    }
  }

}
