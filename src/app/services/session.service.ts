import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs/';
import { map } from 'rxjs/operators';

// import md5 from 'md5';
import { environment } from '../../environments/environment';
import { DefaultHttpHeaders, HeaderNames } from '../config';
import { RegisterForm, User } from '../models/user';
import { OpResult } from '../models/op-result';

@Injectable()
export class SessionService {

  private baseUrl: string;
  private registerUrl: string;

  currentUser: User;

  readonly sessionEventEmitter = new EventEmitter<string>();

  constructor(private http: HttpClient) {
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/login`;
    this.registerUrl = `${apiBase}/register`;
  }

  getHttpOptions() {
    let headers = new HttpHeaders(DefaultHttpHeaders);
    let UN = HeaderNames.UserName;
    let UT = HeaderNames.UserToken;
    // let NTD = HeaderNames.NameTokenDigest;

    let cu = this.currentUser;
    if (cu && cu.name && cu.accessToken) {
      headers = headers.set(UN, cu.name);
      headers = headers.set(UT, cu.accessToken);
      // let digest = this.getMd5(`${cu.name}.${cu.accessToken}`);
      // headers = headers.set(NTD, digest);
    } else {
      let storage = window.localStorage;
      let un = storage.getItem(UN);
      let ut = storage.getItem(UT);
      if (un && ut) {
        headers = headers.set(UN, un);
        headers = headers.set(UT, ut);
        // let digest = this.getMd5(`${un}.${ut}`);
        // headers = headers.set(NTD, digest);
      }
    }
    return {
      headers/*,
      withCredentials: true*/
    };
  }

  login(name, pass): Observable<OpResult> {
    return this.http.post(this.baseUrl, { name, pass }, this.getHttpOptions())
      .pipe(
        map((opr: OpResult) => {
          if (opr && opr.ok === 1) {
            let ui = opr as any;
            this.onLoginSuccess(ui);
          }
          return opr;
        }));
  }

  onLoginSuccess(ui) {
    this.updateCurrentUser(ui);
    this.sessionEventEmitter.emit('Login');
  }

  logout(): Observable<OpResult> {
    return this.http.delete(this.baseUrl, this.getHttpOptions())
      .pipe(
        map((opr: OpResult) => {
          console.log(opr);
          if (opr && opr.ok === 1) {
            this.logoutLocally();
          }
          return opr;
        })
      );
  }


  logoutLocally() {
    this.currentUser = null;
    let storage = window.localStorage;
    storage.removeItem(HeaderNames.UserName);
    storage.removeItem(HeaderNames.UserToken);
    this.sessionEventEmitter.emit('Logout');
  }

  private updateCurrentUser(ui) {
    let cu = new User();
    Object.assign(cu, ui);
    if (cu.accessToken) {
      let storage = window.localStorage;
      storage.setItem(HeaderNames.UserName, cu.name);
      storage.setItem(HeaderNames.UserToken, cu.accessToken);
    }
    this.currentUser = cu;
  }

  checkLogin(): Observable<User> {
    let ho = this.getHttpOptions();
    let UN = HeaderNames.UserName;
    if (!ho.headers.get(UN)) {
      this.currentUser = null;
      return of(null);
    }
    let url = `${this.baseUrl}/userinfo`;
    return this.http.get<any>(url, ho)
      .pipe(
        map(ui => {
          if (ui && ui.login) {
            this.updateCurrentUser(ui);
          } else {
            this.currentUser = null;
          }
          return this.currentUser;
        }));
  }

  register(form: RegisterForm): Observable<OpResult> {
    return this.http.post<OpResult>(this.registerUrl, form, this.getHttpOptions());
  }
}
