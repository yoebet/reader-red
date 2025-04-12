import { ComponentFactory, ComponentFactoryResolver, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SuiSearch } from 'ng2-semantic-ui/dist/modules/search/components/search';

import * as Drop from 'tether-drop';

import { DictEntry } from '../models/dict-entry';
import { DictService } from '../services/dict.service';
import { DictSimpleComponent } from './dict-simple.component';
import { UIConstants } from '../config';

export abstract class DictSearchComponent implements OnInit {
  @ViewChild('dictSimple', { read: ViewContainerRef }) dictSimple: ViewContainerRef;
  @ViewChild('searchInput', { read: SuiSearch }) searchInput: SuiSearch<any>;
  entry: DictEntry;

  phrase = false;
  phraseOnly = false;
  wordScope = 'All';

  simpleDictComponentRef: ComponentRef<DictSimpleComponent>;
  lastWordDrop = null;

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


  protected constructor(protected dictService: DictService,
                        protected resolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
  }

  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  clearHistory() {
    this.dictService.clearHistory();
  }

  selectWord(uw) {
    this.dictService.getEntry(uw.word)
      .subscribe(entry => {
        this.entry = entry;
      });
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

  private getSimpleDictComponentRef() {
    if (!this.simpleDictComponentRef) {
      let factory: ComponentFactory<DictSimpleComponent> = this.resolver.resolveComponentFactory(DictSimpleComponent);
      this.dictSimple.clear();
      this.simpleDictComponentRef = this.dictSimple.createComponent(factory);
    }
    return this.simpleDictComponentRef;
  }

  showDictSimplePopup(el, entry) {
    if (this.lastWordDrop) {
      this.lastWordDrop.destroy();
      this.lastWordDrop = null;
    }
    let dscr = this.getSimpleDictComponentRef();
    let content = function () {
      dscr.instance.entry = entry;
      return dscr.location.nativeElement;
    };
    let drop = new Drop({
      target: el,
      content,
      classes: `${UIConstants.dropClassPrefix}dict`,
      constrainToScrollParent: false,
      remove: true,
      openOn: 'click', // click,hover,always
      tetherOptions: {
        attachment: 'top center',
        constraints: [
          {
            to: 'window',
            attachment: 'together',
            pin: true
          }
        ]
      }
    });
    drop.open();
    drop.once('close', () => {
      if (this.lastWordDrop === drop) {
        this.lastWordDrop = null;
      }
    });
    this.lastWordDrop = drop;
  }

  showUserWord($event, uw) {
    $event.stopPropagation();
    $event.preventDefault();
    let el = $event.target;
    this.dictService.getEntry(uw.word, { pushHistory: false })
      .subscribe(entry => {
        if ($event.which === 3) {
          this.showDictSimplePopup(el, entry);
        } else {
          this.entry = entry;
        }
      });
  }

  showEntry($event, entry) {
    $event.stopPropagation();
    $event.preventDefault();
    if ($event.which === 3) {
      this.showDictSimplePopup($event.target, entry);
    } else {
      this.entry = entry;
    }
  }

}
