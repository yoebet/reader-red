import { Injectable } from '@angular/core';
import { SessionService } from './session.service';
import { SuiModalService } from 'ng2-semantic-ui';

@Injectable()
export class AppService {

  constructor(protected sessionService: SessionService,
              protected modalService: SuiModalService) {
  }

}
