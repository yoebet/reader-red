import { Component, Input, OnInit } from '@angular/core';
import { ComponentModalConfig, SuiModal } from 'ng2-semantic-ui';
import { ModalSize } from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';
import { StaticResource } from '../config';
import { Book } from '../models/book';
import { BookService } from '../services/book.service';

@Component({
  selector: 'book-image',
  templateUrl: './book-image.component.html',
  styleUrls: ['./book-image.component.css']
})
export class BookImageComponent implements OnInit {
  @Input() book: Book;

  bookImagesBase = StaticResource.BookImagesBase;
  bookImageNotSet = StaticResource.BookImageNotSet;

  constructor(private bookService: BookService,
              private modal: SuiModal<Book, string, string>) {
    this.book = modal.context;
  }

  ngOnInit(): void {
  }

  close() {
    this.modal.approve('');
  }

}


export class BookImageModal extends ComponentModalConfig<Book> {
  constructor(book: Book) {
    super(BookImageComponent, book, true);
    this.size = ModalSize.Tiny;
    // this.isFullScreen = true;
    this.mustScroll = false;
    // this.isBasic = true;
    this.isClosable = true;
  }
}
