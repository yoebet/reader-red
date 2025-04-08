import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Book} from '../models/book';
import {BookService} from '../services/book.service';

@Component({
  selector: 'book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
  books: Book[];
  private allBooks: Book[];
  private myBooks: Book[];
  listAllBooks = false;
  showZh = true;

  constructor(private bookService: BookService,
              private router: Router) {
  }

  getBooks(): void {
    this.bookService
      .list()
      .subscribe(books => {
        this.allBooks = books;
        this.myBooks = books.filter(book => !!book.userBook);
        this.books = this.myBooks;
      });
  }

  ngOnInit(): void {
    this.getBooks();
  }

  changeList() {
    if (this.listAllBooks) {
      this.books = this.allBooks;
    } else {
      this.books = this.myBooks;
    }
  }

  gotoDetail(book: Book): void {
    this.router.navigate(['/books', book._id]);
  }

  bookTracker(index, book) {
    return book._id;
  }

}
