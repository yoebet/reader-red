import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { SessionService } from '../../services/session.service';
import { OpResult } from '../../models/op-result';
import { RegisterForm } from '../../models/user';

@Component({
  selector: 'register-form',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  message: string;
  form: RegisterForm;
  confirmedPass: string;


  constructor(protected sessionService: SessionService,
              protected router: Router,
              protected location: Location) {
  }

  ngOnInit() {
    this.form = new RegisterForm();
    this.confirmedPass = '';
  }

  checkName(ignoreEmpty = true) {
    let name = this.form.name = this.form.name.trim();
    if (!name) {
      if (!ignoreEmpty) {
        this.message = '请输入用户名';
      }
      return false;
    }
    if (name.length < 4) {
      this.message = '用户名过短';
      return false;
    }
    if (!/^[a-z][a-z0-9_]+$/i.test(name)) {
      this.message = '用户名仅支持字母、数字和下划线，且以字母开头';
      return false;
    }
    return true;
  }

  checkNickName(ignoreEmpty = true) {
    let name = this.form.nickName = this.form.nickName.trim();
    if (!name) {
      if (!ignoreEmpty) {
        this.message = '请输入昵称';
      }
      return false;
    }
    if (name.length > 10) {
      this.message = '昵称过长';
    }
    if (/[ \t\r\n]/.test(name)) {
      this.message = '昵称不能包含空格';
      return false;
    }
    return true;
  }

  checkPass(ignoreEmpty = true) {
    let pass = this.form.pass = this.form.pass.trim();
    if (!pass) {
      if (!ignoreEmpty) {
        this.message = '请输入密码';
      }
      return false;
    }
    if (pass.length < 5) {
      this.message = '密码过短';
      return false;
    }
    return true;
  }

  checkConfirmedPass(ignoreEmpty = true) {
    let confirmedPass = this.confirmedPass = this.confirmedPass.trim();
    if (!confirmedPass) {
      if (!ignoreEmpty) {
        this.message = '请确认密码';
      }
      return false;
    }
    let pass = this.form.pass.trim();
    if (!pass) {
      return false;
    }
    if (confirmedPass !== pass) {
      this.message = '两次输入的密码不一致';
      return false;
    }
    return true;
  }

  checkFrc(ignoreEmpty = true) {
    if (!this.form.frc) {
      return true;
    }
    let frc = this.form.frc = this.form.frc.trim();
    return true;
  }

  register() {
    if (!this.checkName(false)) {
      return;
    }
    if (!this.checkNickName(false)) {
      return;
    }
    if (!this.checkPass(false)) {
      return;
    }
    if (!this.checkConfirmedPass(false)) {
      return;
    }
    this.sessionService.register(this.form)
      .subscribe((opr: OpResult) => {
        if (!opr) {
          return;
        }
        if (opr.ok === 1) {
          this.message = null;
          alert('注册成功，请登录');
          this.router.navigate(['']);
        } else {
          if (opr.message) {
            this.message = opr.message;
          } else {
            this.message = '注册失败';
          }
        }
      }, (err) => {
        this.message = '发生错误了';
      });
  }

}
