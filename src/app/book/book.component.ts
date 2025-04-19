import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';

import { Book } from '../models/book';
import { Chap } from '../models/chap';
import { UserBook } from '../models/user-book';
import { BookService } from '../services/book.service';

@Component({
  selector: 'book-detail',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {
  book: Book;
  userBook: UserBook;
  chaps: Chap[];

  showZh = true;

  constructor(private bookService: BookService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) =>
        this.bookService.getDetail(params.get('id')))
    ).subscribe(book => {
      if (!book) {
        return;
      }
      if (!book.chaps) {
        book.chaps = [];
      }
      this.userBook = book.userBook;
      this.book = book;
      this.chaps = this.book.chaps;
    });
  }

  chapTracker(index, chap) {
    return chap._id;
  }

  goBack(): void {
    this.location.back();
  }
}
