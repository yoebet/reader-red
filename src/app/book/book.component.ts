import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {Location} from '@angular/common';
import 'rxjs/add/operator/switchMap';

import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {UserBook} from '../models/user-book';
import {BookService} from '../services/book.service';

@Component({
  selector: 'book-detail',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {
  book: Book;
  userBook: UserBook;
  chaps: Chap[];
  private allChaps: Chap[];
  private myChaps: Chap[];
  listAllChaps = false;

  constructor(private bookService: BookService,
              private route: ActivatedRoute,
              private router: Router,
              private location: Location) {
  }

  ngOnInit(): void {
    this.route.paramMap.switchMap((params: ParamMap) =>
      this.bookService.getDetail(params.get('id'))
    ).subscribe(book => {
      if (!book) {
        return;
      }
      if (!book.chaps) {
        book.chaps = [];
      }
      this.userBook = book.userBook;
      this.book = book;
      this.allChaps = this.book.chaps;

      if (this.userBook) {
        let userChaps = this.userBook.chaps;
        for (let chap of this.allChaps) {
          if (this.userBook.isAllChaps) {
            chap.isMyChap = true;
          } else if (userChaps && userChaps.find(uc => uc.chapId === chap._id)) {
            chap.isMyChap = true;
          }
        }
      }
      this.myChaps = this.allChaps.filter(c => c.isMyChap);
      this.changeList();
    });
  }

  changeList() {
    if (this.listAllChaps) {
      this.chaps = this.allChaps;
    } else {
      this.chaps = this.myChaps;
    }
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
