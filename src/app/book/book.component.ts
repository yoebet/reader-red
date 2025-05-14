import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';

import { Book } from '../models/book';
import { Chap } from '../models/chap';
import { UserBook } from '../models/user-book';
import { BookService } from '../services/book.service';
import { WordStatService } from '../services/word-stat.service';
import { WordStatModal } from './word-stat.component';
import { SuiModalService } from 'ng2-semantic-ui';
import { StaticResource } from '../config';
import { BookImageModal } from './book-image.component';
import { BookCategoryService } from '../services/book-category.service';

@Component({
  selector: 'book-detail',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {
  book: Book;
  userBook: UserBook;
  chaps: Chap[];
  bookImagesBase = StaticResource.BookImagesBase;
  bookImageNotSet = StaticResource.BookImageNotSet;
  categoryNames: Record<string, string> = {};

  showZh = true;

  constructor(private bookService: BookService,
              private categoryService: BookCategoryService,
              private wordStatService: WordStatService,
              private modalService: SuiModalService,
              private route: ActivatedRoute,
              protected router: Router,
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
    this.categoryService.getCategoryNames()
      .subscribe(cns => {
        this.categoryNames = cns;
      });
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

  async showChapStat(chap: Chap) {
    let stat = chap.stat;
    if (!stat) {
      stat = await this.wordStatService.getChapStat(chap._id).toPromise();
    }
    if (stat) {
      this.modalService.open(new WordStatModal({ stat, title: chap.name }));
    }
  }

  showImage(book: Book) {
    this.modalService.open(new BookImageModal(book));
  }

  chapTracker(index, chap) {
    return chap._id;
  }

  goBack(): void {
    // this.location.back();
    this.router.navigate(['books']);
  }
}
