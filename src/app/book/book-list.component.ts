import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SuiModalService } from 'ng2-semantic-ui';

import { Book } from '../models/book';
import { BookService } from '../services/book.service';
import { TextSearchBooksModal } from '../preference/text-search-books.component';
import { WordStatService } from '../services/word-stat.service';
import { WordStatModal } from './word-stat.component';

@Component({
  selector: 'book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
  publicBooks: Book[];
  personalBooks: Book[];

  books: Book[];
  listName = 'public';
  showZh = true;

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

}
