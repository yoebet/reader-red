import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {SuiModule} from 'ng2-semantic-ui';

import {AppRoutingModule} from './app-routing.module';

import {AppService} from './services/app.service';
import {BookService} from './services/book.service';
import {ChapService} from './services/chap.service';
import {DictService} from './services/dict.service';
import {VocabularyService} from './services/vocabulary.service';

import {CreatedDatePipe} from './pipes/created-date.pipe';
import {CreatedDateStringPipe} from './pipes/created-date-string.pipe';
import {WordFamiliarityPipe} from './pipes/word-familiarity.pipe';

import {AppComponent} from './app.component';
import {BooksComponent} from './book/books.component';
import {BookComponent} from './book/book.component';
import {ChapComponent} from './chap/chap.component';
import {ParaContentComponent} from './content/para-content.component';
import {WordAnnosComponent} from './content/word-annos.component';
import {DictComponent} from './dict/dict.component';
import {DictEntryComponent} from './dict/dict-entry.component';
import {DictEntrySmiComponent} from './dict/dict-entry-smi.component';
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
    BooksComponent,
    BookComponent,
    ChapComponent,
    ParaContentComponent,
    WordAnnosComponent,
    DictComponent,
    DictEntryComponent,
    DictEntrySmiComponent,
    CreatedDatePipe,
    CreatedDateStringPipe,
    WordFamiliarityPipe,
    VocabularyComponent
  ],
  providers: [
    AppService,
    BookService,
    ChapService,
    DictService,
    VocabularyService
  ],
  entryComponents: [
    WordAnnosComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
