import { Component, ComponentFactoryResolver } from '@angular/core';
import { ComponentModalConfig, ModalSize, SuiModal } from 'ng2-semantic-ui';

import { Para } from '../models/para';
import { ParaComment } from '../models/para-comment';
import { PopupDictSupportComponent } from '../dict/popup-dict-support.component';
import { AnnotationsService } from '../services/annotations.service';
import { UserVocabularyService } from '../services/user-vocabulary.service';
import { DictZhService } from '../services/dict-zh.service';

@Component({
  selector: 'para-comments-ext',
  templateUrl: './para-comments-ext.component.html'
})
export class ParaCommentsExtComponent extends PopupDictSupportComponent {
  para: Para;
  comments: ParaComment[];

  constructor(protected annoService: AnnotationsService,
              protected vocabularyService: UserVocabularyService,
              protected dictZhService: DictZhService,
              protected resolver: ComponentFactoryResolver,
              private modal: SuiModal<Para, string, string>) {
    super(annoService, vocabularyService, dictZhService, resolver);
    this.para = modal.context;
    this.comments = this.para.comments || [];
  }

  ngOnInit() {
    super.ngOnInit();
    this.onBookChanged(this.para.book);
  }

  close() {
    this.onDictItemSelect(null);
    this.modal.approve('');
  }
}

export class ParaCommentsExtModal extends ComponentModalConfig<Para> {
  constructor(context: Para) {
    super(ParaCommentsExtComponent, context, true);
    this.size = ModalSize.Tiny;
    this.mustScroll = true;
  }
}
