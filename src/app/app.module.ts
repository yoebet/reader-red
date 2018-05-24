import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {SuiModule} from 'ng2-semantic-ui';

import {AppRoutingModule} from './app-routing.module';

import {AppService} from './services/app.service';
import {BookService} from './services/book.service';
import {ChapService} from './services/chap.service';
import {ParaService} from './services/para.service';
import {DictService} from './services/dict.service';
import {UserBookService} from './services/user-book.service';
import {VocabularyService} from './services/vocabulary.service';

import {CreatedDatePipe} from './pipes/created-date.pipe';
import {CreatedDateStringPipe} from './pipes/created-date-string.pipe';
import {WordFamiliarityPipe} from './pipes/word-familiarity.pipe';

import {AppComponent} from './app.component';
import {BookListComponent} from './book/book-list.component';
import {BookComponent} from './book/book.component';
import {ChapComponent} from './chap/chap.component';
import {ParaContentComponent} from './content/para-content.component';
import {WordAnnosComponent} from './content/word-annos.component';
import {DictComponent} from './dict/dict.component';
import {DictEntryComponent} from './dict/dict-entry.component';
import {VocabularyComponent} from './vocabulary/vocabulary.component';

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
    BookListComponent,
    BookComponent,
    ChapComponent,
    ParaContentComponent,
    WordAnnosComponent,
    DictComponent,
    DictEntryComponent,
    CreatedDatePipe,
    CreatedDateStringPipe,
    WordFamiliarityPipe,
    VocabularyComponent
  ],
  providers: [
    AppService,
    BookService,
    ChapService,
    ParaService,
    DictService,
    UserBookService,
    VocabularyService
  ],
  entryComponents: [
    WordAnnosComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
