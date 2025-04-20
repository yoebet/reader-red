import { Component } from '@angular/core';
import { ComponentModalConfig, SuiModal } from 'ng2-semantic-ui';
import { ModalSize } from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';
import { UserWordStat } from '../models/user-word';

interface ImpConfirmContext {
  stat: UserWordStat;
  ignored: string[];
}

@Component({
  selector: 'imp-confirm',
  templateUrl: './imp-confirm.component.html',
  styleUrls: ['./imp-confirm.component.css']
})
export class ImpConfirmComponent {
  stat: UserWordStat;
  ignored: string[];

  constructor(private modal: SuiModal<ImpConfirmContext, string, string>) {
    this.stat = modal.context.stat;
    this.ignored = modal.context.ignored;
  }

  cancel() {
    this.modal.deny('');
  }

  confirm() {
    this.modal.approve('');
  }

}

export class ImpConfirmModal extends ComponentModalConfig<ImpConfirmContext> {
  constructor(context: ImpConfirmContext) {
    super(ImpConfirmComponent, context, false);
    this.size = ModalSize.Mini;
    this.mustScroll = true;
  }
}
