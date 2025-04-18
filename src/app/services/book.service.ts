import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiModalService } from 'ng2-semantic-ui';
import { combineLatest, Observable, of as ObservableOf } from 'rxjs/';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Book } from '../models/book';
import { BaseService } from './base.service';
import { ChapService } from './chap.service';
import { UserBookService } from './user-book.service';
import { SessionService } from './session.service';

@Injectable()
export class BookService extends BaseService<Book> {

  booksMap = new Map<string, Book>();
  booksDetailMap = new Map<string, Book>();

  allBooks: {
    publicBooks: Book[],
    personalBooks: Book[],
  } = null;

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

  listPublicByCat(cat: string): Observable<Book[]> {
    let url = `${this.baseUrl}?cat=${cat}`;
    return super.list(url);
  }

  getDetail(id: string): Observable<Book> {
    let book0 = this.booksDetailMap.get(id);
    if (book0) {
      return ObservableOf(book0);
    }

    return combineLatest(
      super.getDetail(id) as Observable<Book>,
      this.userBookService.getOne(id)
    ).pipe(map(([book, userBook]) => {
        if (book) {
          book.userBook = userBook;
          this.booksDetailMap.set(book._id, book);
          this.chapService.cacheBookChaps(book);
        }
        return book;
      })
    );
  }


  getOne(id: string): Observable<Book> {
    let book0 = this.booksDetailMap.get(id);
    if (book0) {
      return ObservableOf(book0);
    }
    if (this.booksMap) {
      let book = this.booksMap.get(id);
      if (book) {
        return ObservableOf(book);
      }
    }
    return super.getOne(id)
      .pipe(tap(book => this.booksMap.set(book._id, book)));
  }

  loadAll(): Observable<{
    publicBooks: Book[];
    personalBooks: Book[]
  }> {
    if (this.allBooks) {
      return ObservableOf(this.allBooks);
    }
    return combineLatest(
      super.list() as Observable<Book[]>,
      super.list(`${this.baseUrl}/personal`) as Observable<Book[]>,
      this.userBookService.list())
      .pipe(map(([publicBooks, personalBooks, userBooks]) => {
        if (userBooks && userBooks.length > 0) {
          for (let book of publicBooks) {
            book.userBook = userBooks.find(ub => ub.bookId === book._id);
          }
          for (let book of personalBooks) {
            book.userBook = userBooks.find(ub => ub.bookId === book._id);
          }
        }
        personalBooks = personalBooks.filter(b => {
          // if (b.userBook.role) {
          //   return true;
          // }
          return !publicBooks.find(pb => pb._id === b._id);
        });
        for (const book of publicBooks.concat(personalBooks)) {
          this.booksMap.set(book._id, book);
        }
        this.allBooks = {
          publicBooks,
          personalBooks,
        };
        return this.allBooks;
      }));
  }


}
