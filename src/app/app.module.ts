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
import {WordCategoryService} from './services/word-category.service';
import {UserPreferenceService} from './services/user-preference.service';
import {AnnotationFamilyService} from './services/annotation-family.service';

import {CreatedDatePipe} from './pipes/created-date.pipe';
import {CreatedDateStringPipe} from './pipes/created-date-string.pipe';
import {WordFamiliarityPipe} from './pipes/word-familiarity.pipe';

import {AppComponent} from './app.component';
import {BookListComponent} from './book/book-list.component';
import {BookComponent} from './book/book.component';
import {ChapComponent} from './chap/chap.component';
import {ParaContentComponent} from './content/para-content.component';
import {WordAnnosComponent} from './content/word-annos.component';
import {DictEntryComponent} from './dict/dict-entry.component';
import {VocabularyComponent} from './vocabulary/vocabulary.component';
import {BaseVocabularyComponent} from './preference/base-vocabulary.component';
import {SimpleMeaningsComponent} from './dict/simple-meanings.component';
import {ApproximateNumberPipe} from "./pipes/approximate-number.pipe";
import {WordTagsSettingComponent} from "./preference/word-tags-setting.component";
import {UserWordComponent} from './dict/user-word.component';
import {WordTagsComponent} from './dict/word-tags.component';
import {WordTextComponent} from './dict/word-text.component';

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
    DictEntryComponent,
    CreatedDatePipe,
    CreatedDateStringPipe,
    WordFamiliarityPipe,
    ApproximateNumberPipe,
    VocabularyComponent,
    BaseVocabularyComponent,
    SimpleMeaningsComponent,
    WordTagsSettingComponent,
    UserWordComponent,
    WordTagsComponent,
    WordTextComponent
  ],
  providers: [
    AppService,
    BookService,
    ChapService,
    ParaService,
    DictService,
    UserBookService,
    VocabularyService,
    WordCategoryService,
    UserPreferenceService,
    AnnotationFamilyService
  ],
  entryComponents: [
    WordAnnosComponent,
    SimpleMeaningsComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
