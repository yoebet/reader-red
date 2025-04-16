import {Component} from '@angular/core';
import {ComponentModalConfig, SuiModal, ModalSize} from 'ng2-semantic-ui';

import {Para} from '../models/para';
import {ParaComment} from '../models/para-comment';

@Component({
  selector: 'para-comments-ext',
  templateUrl: './para-comments-ext.component.html'
})
export class ParaCommentsExtComponent {
  para: Para;
  comments: ParaComment[];

  constructor(private modal: SuiModal<Para, string, string>) {
    this.para = modal.context;
    this.comments = this.para.comments;
  }

  close() {
    this.modal.deny('');
  }
}

export class ParaCommentsExtModal extends ComponentModalConfig<Para> {
  constructor(context: Para) {
    super(ParaCommentsExtComponent, context, true);
    this.size = ModalSize.Tiny;
    this.mustScroll = true;
  }
}
