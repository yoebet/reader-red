import { Component, OnInit } from '@angular/core';

import { DictService } from './services/dict.service';
import { UserWordService } from './services/user-word.service';
import { SessionService } from './services/session.service';
import { TextSearchBooksModal } from './preference/text-search-books.component';
import { SuiModalService } from 'ng2-semantic-ui';
import { LoginModal } from './account/login-popup.component';
import { WordTagsSettingModal } from './preference/word-tags-setting.component';

@Component({
  selector: 'app-a',
  templateUrl: './app-a.component.html',
  styleUrls: ['./app-a.component.css']
})
export class AppAComponent implements OnInit {

  // loginForm = false;

  get currentUser() {
    return this.sessionService.currentUser;
  }

  constructor(private sessionService: SessionService,
              private dictService: DictService,
              private modalService: SuiModalService,
              private userWordService: UserWordService) {
  }

  ngOnInit() {
    this.sessionService.sessionEventEmitter.subscribe(change => {
      // this.bookService.clearBookList();
      // this.chapService.clearCache();
      this.dictService.clearHistory();
      this.userWordService.clearCache();
    });
    this.sessionService.checkLogin().subscribe();
  }

  gotoLogin() {
    // this.loginForm = true;
    this.modalService.open<string, string, string>(new LoginModal(null));
  }

  logout() {
    this.sessionService.logout().subscribe();
  }

  showTextSearchScope() {
    this.modalService.open(new TextSearchBooksModal({ edit: false }));
  }

  showWordTagsSetting() {
    this.modalService.open(new WordTagsSettingModal(''));
  }
}
