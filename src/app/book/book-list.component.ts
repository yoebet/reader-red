import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SuiModalService } from 'ng2-semantic-ui';

import { Book } from '../models/book';
import { BookService } from '../services/book.service';
import { TextSearchBooksModal } from '../preference/text-search-books.component';
import { WordStatService } from '../services/word-stat.service';
import { WordStatModal } from './word-stat.component';
import { StaticResource } from '../config';
import { BookImageModal } from './book-image.component';

@Component({
  selector: 'book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
  publicBooks: Book[];
  personalBooks: Book[];

  books: Book[];
  page = 1; // 1 based
  pageSize = 10;
  paginatedBooks: Book[];
  listName = 'public';
  showZh = true;
  bookImagesBase = StaticResource.BookImagesBase;
  bookImageNotSet = StaticResource.BookImageNotSet;

  constructor(private bookService: BookService,
              private wordStatService: WordStatService,
              protected modalService: SuiModalService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.bookService.loadAll()
      .subscribe(({ publicBooks, personalBooks }) => {
        this.publicBooks = publicBooks;
        this.personalBooks = personalBooks;
        this.setList();
      });
  }

  setList(name?: string): void {
    if (name) {
      this.listName = name;
    } else {
      name = this.listName;
    }
    this.books = name === 'personal' ? this.personalBooks : this.publicBooks;
    this.resetPage(1);
  }

  resetPage(page) {
    this.page = page;
    if (!this.books) {
      this.paginatedBooks = [];
      return;
    }
    let booksCount = this.books.length;
    let from = (this.page - 1) * this.pageSize;
    let to = from + this.pageSize;
    if (from > booksCount) {
      from = booksCount;
    }
    if (to > booksCount) {
      to = booksCount;
    }
    this.paginatedBooks = this.books.slice(from, to);
  }

  gotoPage(page) {
    page = parseInt(page);
    if (isNaN(page)) {
      return;
    }
    if (page < 1) {
      page = 1;
    }
    this.resetPage(page);
  }

  nextPage() {
    if (!this.paginatedBooks) {
      return;
    }
    if (this.paginatedBooks.length < this.pageSize) {
      return;
    }
    this.resetPage(this.page + 1);
  }

  previousPage() {
    if (!this.paginatedBooks) {
      return;
    }
    if (this.page === 1) {
      return;
    }
    this.resetPage(this.page - 1);
  }

  bookTracker(index, book) {
    return book._id;
  }

  configTextSearchScope() {
    this.modalService.open(new TextSearchBooksModal({ edit: true }));
  }

  async showBookStat(book: Book) {
    let stat = book.stat;
    if (!stat) {
      stat = await this.wordStatService.getBookStat(book._id).toPromise();
    }
    if (stat) {
      this.modalService.open(new WordStatModal({ stat, title: book.name }));
    }
  }

  showImage(book: Book) {
    this.modalService.open(new BookImageModal(book));
  }

}
