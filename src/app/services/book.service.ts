import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import {Book} from '../models/book';
import {BaseService} from './base.service';
import {ChapService} from './chap.service';
import {UserBookService} from "./user-book.service";

@Injectable()
export class BookService extends BaseService<Book> {

  allBooks: Book[];
  booksDetailMap = new Map<string, Book>();

  constructor(protected http: HttpClient, private chapService: ChapService, private userBookService: UserBookService) {
    super(http);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/books`;
  }

  clearCache() {
    this.allBooks = null;
    this.booksDetailMap.clear();
  }

  clearBookList() {
    this.allBooks = null;
  }

  getDetail(id: string): Observable<Book> {
    let book = this.booksDetailMap.get(id);
    if (book) {
      return Observable.of(book);
    }

    let obs = Observable.combineLatest(
      super.getDetail(id) as Observable<Book>,
      this.userBookService.getOne(id))
      .map(([book, userBook]) => {
        if (book) {
          book.userBook = userBook;
        }
        return book;
      }) as Observable<Book>;

    obs = obs.share();
    obs.subscribe((book: Book) => {
      this.booksDetailMap.set(book._id, book);
      this.chapService.cacheBookChaps(book);
    });
    return obs;
  }


  getOne(id: string): Observable<Book> {
    let book = this.booksDetailMap.get(id);
    if (book) {
      return Observable.of(book);
    }
    if (this.allBooks) {
      let book = this.allBooks.find(b => b._id === id);
      if (book) {
        return Observable.of(book);
      }
    }
    return super.getOne(id) as Observable<Book>;
  }

  list(): Observable<Book[]> {
    let obs = Observable.combineLatest(
      super.list() as Observable<Book[]>,
      this.userBookService.list())
      .map(([books, userBooks]) => {
        if (userBooks && userBooks.length > 0) {
          for (let book of books) {
            book.userBook = userBooks.find(ub => ub.bookId === book._id);
          }
        }
        return books;
      }) as Observable<Book[]>;

    obs = obs.share();
    obs.subscribe((books: Book[]) => {
      this.allBooks = books;
    });
    return obs;
  }


}
