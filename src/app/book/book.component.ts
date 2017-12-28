import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {Location} from '@angular/common';
import 'rxjs/add/operator/switchMap';

import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {BookService} from '../services/book.service';

@Component({
  selector: 'book-detail',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {
  book: Book;

  constructor(private bookService: BookService,
              private route: ActivatedRoute,
              private router: Router,
              private location: Location) {
  }

  ngOnInit(): void {
    this.route.paramMap.switchMap((params: ParamMap) =>
      this.bookService.getDetail(params.get('id'))
    ).subscribe(book => {
      if (!book.chaps) {
        book.chaps = [];
      }
      this.book = book;
    });
  }

  gotoDetail(chap: Chap): void {
    this.router.navigate(['/chaps', chap._id]);
  }

  chapTracker(index, chap) {
    return chap._id;
  }

  goBack(): void {
    this.location.back();
  }
}
