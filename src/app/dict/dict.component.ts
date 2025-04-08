import { Component } from '@angular/core';
import { DictSearchComponent } from './dict-search.component';
import { DictService } from '../services/dict.service';

@Component({
  selector: 'dict-main',
  templateUrl: './dict.component.html',
  styleUrls: ['./dict.component.css']
})
export class DictComponent extends DictSearchComponent {

  constructor(protected dictService: DictService) {
    super(dictService);
  }
}
