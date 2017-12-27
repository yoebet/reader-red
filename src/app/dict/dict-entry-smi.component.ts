import {
  Component, Output, EventEmitter,
  AfterViewChecked, ChangeDetectorRef
} from '@angular/core';

import {DictService} from '../services/dict.service';
import {DictEntryComponent} from './dict-entry.component';

@Component({
  selector: 'dict-entry-smi',
  templateUrl: './dict-entry.component.html',
  styleUrls: ['./dict-entry.component.css']
})
export class DictEntrySmiComponent extends DictEntryComponent implements AfterViewChecked {
  @Output() viewReady = new EventEmitter();
  viewReadyEntry = null;

  constructor(cdr: ChangeDetectorRef, dictService: DictService) {
    super(cdr, dictService);
    this.selectMeaningItem = true;
  }

  ngAfterViewChecked() {
    if (this.viewReadyEntry === this.entry) {
      return;
    }
    this.viewReady.emit();
    this.viewReadyEntry = this.entry;
  }

}
