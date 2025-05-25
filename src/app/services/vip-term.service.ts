import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { BaseService } from './base.service';
import { SessionService } from './session.service';
import { VipTerm } from '../models/vip';
import { environment } from '../../environments/environment';

@Injectable()
export class VipTermService extends BaseService<VipTerm> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_vip_codes`;
  }

}
