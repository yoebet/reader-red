import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { Observable } from 'rxjs/';
import { SessionService } from './session.service';
import { environment } from '../../environments/environment';
import { BaseService } from './base.service';
import { User } from '../models/user';

@Injectable()
export class UserProfileService extends BaseService<User> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_profile`;
  }

  getUserDetail(): Observable<User> {
    const url = `${this.baseUrl}/complete`;
    return super.getOneByUrl(url);
  }
}
