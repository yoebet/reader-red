import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Book} from '../models/book';
import {BookService} from '../services/book.service';

@Component({
  selector: 'book-list',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[];

  constructor(private bookService: BookService,
              private router: Router) {
  }

  getBooks(): void {
    this.bookService
      .list()
      .subscribe(books => this.books = books);
  }

  ngOnInit(): void {
    this.getBooks();
  }

  gotoDetail(book: Book): void {
    this.router.navigate(['/books', book._id]);
  }

  bookTracker(index, book) {
    return book._id;
  }

}
