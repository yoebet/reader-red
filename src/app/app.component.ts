import {Component, OnInit} from '@angular/core';

import {AppService} from './services/app.service'
import {OpResult} from './models/op-result';
import {BookService} from "./services/book.service";
import {ChapService} from "./services/chap.service";
import {DictService} from "./services/dict.service";
import {UserWordService} from "./services/user-word.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  loginForm = false;
  loginMessage: string;

  get currentUser() {
    return this.appService.currentUser;
  }

  constructor(private appService: AppService,
              private bookService: BookService,
              private chapService: ChapService,
              private dictService: DictService,
              private vocabularyService: UserWordService) {
  }

  ngOnInit() {
    this.appService.onCurrentUserChanged.subscribe(change => {
      console.log('User Changed: ' + change.from + ' -> ' + change.to);
      this.bookService.clearBookList();
      // this.chapService.clearCache();
      this.dictService.clearHistory();
      this.vocabularyService.clearCache();
    });
    this.appService.checkLogin();
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
    this.appService.login(name, pass).subscribe((opr: OpResult) => {
      if (opr && opr.ok === 1) {
        this.loginMessage = null;
        this.loginForm = false;
      } else {
        this.loginMessage = '用户名/密码错误';
      }
    });
  }

  logout() {
    this.appService.logout();
  }
}
