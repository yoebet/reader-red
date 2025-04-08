import { OnInit, ViewChild } from '@angular/core';
import { SuiSearch } from 'ng2-semantic-ui/dist/modules/search/components/search';

import { DictEntry } from '../models/dict-entry';
import { DictService } from '../services/dict.service';

export abstract class DictSearchComponent implements OnInit {
  @ViewChild('searchInput', { read: SuiSearch }) searchInput: SuiSearch<any>;
  entry: DictEntry;

  phrase = false;
  phraseOnly = false;
  wordScope = 'All';

  dictSearch = (key: string) => {
    let options = {
      phrase: this.phrase && !this.phraseOnly,
      phraseOnly: this.phraseOnly
    };
    if (!this.phraseOnly) {
      for (let category of ['basic', 'cet', 'ielts', 'gre']) {
        if (this.wordScope === category) {
          options[category] = true;
          break;
        }
      }
    }
    let o = this.dictService.search(key.trim(), options);
    return o.toPromise();
  }


  protected constructor(protected dictService: DictService) {
  }

  ngOnInit() {
  }

  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  clearHistory() {
    this.dictService.clearHistory();
  }


  selectHistoryEntry(entry) {
    this.entry = entry;
  }

  selectSearchResult(entrySimple) {
    this.dictService.getEntry(entrySimple.word)
      .subscribe(e => this.entry = e);
  }

  resetSearch() {
    this.searchInput.optionsLookup = this.dictSearch;
  }

  private checkAndSelect(): boolean {
    let searchInput = this.searchInput;
    let results = searchInput.results;
    let query = searchInput.query;
    for (let entry of results) {
      if (entry.word === query) {
        searchInput.select(entry);
        return true;
      }
    }
    return false;
  }

  onSearchKeyup($event) {
    if ($event.which !== 13) {
      return;
    }
    const selected = this.checkAndSelect();
    if (!selected) {
      setTimeout(() => this.checkAndSelect(), 300);
    }
  }

}
