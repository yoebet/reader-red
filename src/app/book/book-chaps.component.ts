import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {ChapService} from '../services/chap.service';
import {OpResult} from '../models/op-result';

@Component({
  selector: 'book-chaps',
  templateUrl: './book-chaps.component.html',
  styleUrls: ['./book-chaps.component.css']
})
export class BookChapsComponent implements OnInit {
  @Input() book: Book;

  constructor(private chapService: ChapService,
              private router: Router) {
  }

  ngOnInit(): void {
    if (!this.book.chaps) {
      this.book.chaps = [];
    }
  }

  gotoDetail(chap: Chap): void {
    this.router.navigate(['/chaps', chap._id]);
  }

  chapTracker(index, chap) {
    return chap._id;
  }

}
