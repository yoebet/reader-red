import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { combineLatest, Observable, of as ObservableOf } from 'rxjs/';
import { map, share } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Book } from '../models/book';
import { BaseService } from './base.service';
import { ChapService } from './chap.service';
import { UserBookService } from './user-book.service';
import { SessionService } from './session.service';

@Injectable()
export class BookService extends BaseService<Book> {

  allBooks: Book[];
  booksDetailMap = new Map<string, Book>();

  // chapContentPacksMap: Map<string, ChapContentPack> = new Map<string, ChapContentPack>();

  constructor(protected http: HttpClient,
              private chapService: ChapService,
              private userBookService: UserBookService,
              protected sessionService: SessionService,
              protected modalService: SuiModalService) {
    super(http, sessionService, modalService);
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

  listByCat(cat: string): Observable<Book[]> {
    let url = `${this.baseUrl}?cat=${cat}`;
    return super.list(url);
  }

  getDetail(id: string): Observable<Book> {
    let book0 = this.booksDetailMap.get(id);
    if (book0) {
      return ObservableOf(book0);
    }

    let obs = combineLatest(
      super.getDetail(id) as Observable<Book>,
      this.userBookService.getOne(id))
      .pipe(map(([book, userBook]) => {
        if (book) {
          book.userBook = userBook;
        }
        return book;
      }), share()) as Observable<Book>;

    obs.subscribe((book: Book) => {
      this.booksDetailMap.set(book._id, book);
      this.chapService.cacheBookChaps(book);
    });
    return obs;
  }


  getOne(id: string): Observable<Book> {
    let book0 = this.booksDetailMap.get(id);
    if (book0) {
      return ObservableOf(book0);
    }
    if (this.allBooks) {
      let book = this.allBooks.find(b => b._id === id);
      if (book) {
        return ObservableOf(book);
      }
    }
    return super.getOne(id);
  }

  list(): Observable<Book[]> {
    let obs = combineLatest(
      super.list() as Observable<Book[]>,
      this.userBookService.list())
      .pipe(map(([books, userBooks]) => {
        if (userBooks && userBooks.length > 0) {
          for (let book of books) {
            book.userBook = userBooks.find(ub => ub.bookId === book._id);
          }
        }
        return books;
      }), share()) as Observable<Book[]>;

    obs.subscribe((books: Book[]) => {
      this.allBooks = books;
    });
    return obs;
  }


}
