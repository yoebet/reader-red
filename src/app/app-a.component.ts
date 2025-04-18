import { Component, OnInit } from '@angular/core';

import { OpResult } from './models/op-result';
import { BookService } from './services/book.service';
import { DictService } from './services/dict.service';
import { UserWordService } from './services/user-word.service';
import { SessionService } from './services/session.service';
import { TextSearchBooksModal } from './book/text-search-books.component';
import { SuiModalService } from 'ng2-semantic-ui';

@Component({
  selector: 'app-a',
  templateUrl: './app-a.component.html',
  styleUrls: ['./app-a.component.css']
})
export class AppAComponent implements OnInit {

  loginForm = false;
  loginMessage: string;

  inReader = true;

  get currentUser() {
    return this.sessionService.currentUser;
  }

  constructor(private sessionService: SessionService,
              // private bookService: BookService,
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
    this.loginMessage = null;
    this.loginForm = true;
  }

  cancelLogin() {
    this.loginMessage = null;
    this.loginForm = false;
  }

  login(name, pass) {
    this.sessionService.login(name, pass).subscribe((opr: OpResult) => {
      if (opr && opr.ok === 1) {
        this.loginMessage = null;
        this.loginForm = false;
      } else {
        this.loginMessage = '用户名/密码错误';
      }
    });
  }

  logout() {
    this.sessionService.logout().subscribe();
  }

  showTextSearchScope() {
    this.modalService.open(new TextSearchBooksModal({ edit: false }));
  }
}
