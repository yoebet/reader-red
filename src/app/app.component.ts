import { Component, OnInit } from '@angular/core';

import { OpResult } from './models/op-result';
import { BookService } from './services/book.service';
import { DictService } from './services/dict.service';
import { UserWordService } from './services/user-word.service';
import { SessionService } from './services/session.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  loginForm = false;
  loginMessage: string;

  inReader = true;

  get currentUser() {
    return this.sessionService.currentUser;
  }

  constructor(private sessionService: SessionService,
              private bookService: BookService,
              private dictService: DictService,
              private userWordService: UserWordService,
              protected route: ActivatedRoute) {
    route.url.subscribe((urlsegs) => {
      console.log(urlsegs);
      console.log(urlsegs[0]);
      console.log(urlsegs[0].path);
    });
  }

  ngOnInit() {
    this.sessionService.sessionEventEmitter.subscribe(change => {
      this.bookService.clearBookList();
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
    this.sessionService.logout();
  }
}
