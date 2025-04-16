import { Component, ComponentFactoryResolver } from '@angular/core';
import { DictService } from '../services/dict.service';
import { ParaContentComponent } from './para-content.component';
import { DictZhService } from '../services/dict-zh.service';

@Component({
  selector: 'para-comment-content',
  templateUrl: './para-comment-content.component.html'
})
export class ParaCommentContentComponent extends ParaContentComponent {
  lookupDictSimple = true;

  constructor(protected dictService: DictService,
              protected dictZhService: DictZhService,
              protected resolver: ComponentFactoryResolver) {
    super(dictService, dictZhService, resolver);
  }

}
