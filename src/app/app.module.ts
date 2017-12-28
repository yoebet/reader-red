import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {SuiModule} from 'ng2-semantic-ui';

import {AppRoutingModule} from './app-routing.module';

import {BookService} from './services/book.service';
import {ChapService} from './services/chap.service';
import {DictService} from './services/dict.service';
import {UserService} from './services/user.service';

import {CreatedDatePipe} from './pipes/created-date.pipe';
import {CreatedDateStringPipe} from './pipes/created-date-string.pipe';

import {AppComponent} from './app.component';
import {BooksComponent} from './book/books.component';
import {BookComponent} from './book/book.component';
import {ChapComponent} from './chap/chap.component';
import {ParaContentComponent} from './content/para-content.component';
import {WordAnnosComponent} from './content/word-annos.component';
import {DictComponent} from './dict/dict.component';
import {DictEntryComponent} from './dict/dict-entry.component';
import {DictEntrySmiComponent} from './dict/dict-entry-smi.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    SuiModule
  ],
  declarations: [
    AppComponent,
    BooksComponent,
    BookComponent,
    ChapComponent,
    ParaContentComponent,
    WordAnnosComponent,
    DictComponent,
    DictEntryComponent,
    DictEntrySmiComponent,
    CreatedDatePipe,
    CreatedDateStringPipe
  ],
  providers: [
    BookService,
    ChapService,
    DictService,
    UserService
  ],
  entryComponents: [
    WordAnnosComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
