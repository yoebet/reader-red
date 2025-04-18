import { Component, OnInit } from '@angular/core';
import { ComponentModalConfig, SuiModal } from 'ng2-semantic-ui';
import { ModalSize } from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';
import { BookService } from '../services/book.service';
import { Book } from '../models/book';
import { UserBookService } from '../services/user-book.service';
import { UserBook } from '../models/user-book';


export interface TextSearchConfigContext {
  edit: boolean;
}

interface TextSearchBook {
  book: Book;
  textSearchOri: boolean;
  textSearch: boolean;
}

@Component({
  selector: 'text-search-books',
  templateUrl: './text-search-books.component.html',
  styleUrls: ['./text-search-books.component.css']
})
export class TextSearchBooksComponent implements OnInit {
  books: Book[];
  tsBooks: Book[];
  candidates: TextSearchBook[];

  edit = false;

  constructor(private bookService: BookService,
              private userBookService: UserBookService,
              private modal: SuiModal<TextSearchConfigContext, string, string>) {
    this.edit = modal.context.edit;
  }

  ngOnInit(): void {
    this.bookService.loadAll()
      .subscribe(({ publicBooks, personalBooks }) => {
        this.books = personalBooks.concat(publicBooks);
        if (this.edit) {
          this.enterEdit();
        } else {
          this.exitEdit();
        }
      });
  }

  enterEdit() {
    this.candidates = this.books.map(book => {
      const ts = !!(book.userBook && book.userBook.textSearch);
      return {
        book,
        textSearchOri: ts,
        textSearch: ts,
      };
    });
    this.edit = true;
  }

  exitEdit() {
    this.tsBooks = this.books.filter(book => book.userBook && book.userBook.textSearch);
    this.edit = false;
  }

  save() {
    console.log(this.candidates.map(c => `${c.book.code}: ${c.textSearch}`).join('\n'));
    const bookIds = this.candidates
      .filter(c => c.textSearch)
      .map(c => c.book._id);
    this.userBookService.resetTextSearch(bookIds).subscribe((result) => {
      if (result && result.ok) {
        for (const c of this.candidates) {
          if (c.textSearch !== c.textSearchOri) {
            const book = c.book;
            let ub = book.userBook;
            if (!ub) {
              ub = {} as UserBook;
              book.userBook = ub;
            }
            ub.textSearch = c.textSearch;
            c.textSearchOri = c.textSearch;
          }
        }
        this.exitEdit();
      }
    });
  }

  close() {
    this.modal.approve('');
  }
}


export class TextSearchBooksModal extends ComponentModalConfig<TextSearchConfigContext> {
  constructor(context: TextSearchConfigContext) {
    super(TextSearchBooksComponent, context, false);
    this.size = ModalSize.Tiny;
    this.mustScroll = true;
    this.isClosable = true;
  }
}
