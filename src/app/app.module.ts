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
import {UserWordService} from './services/user-word.service';
import {WordCategoryService} from './services/word-category.service';
import {UserVocabularyService} from './services/user-vocabulary.service';
import {UserPreferenceService} from './services/user-preference.service';
import {AnnotationsService} from './services/annotations.service';

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
import {ApproximateNumberPipe} from './pipes/approximate-number.pipe';
import {WordTagsSettingComponent} from './preference/word-tags-setting.component';
import {UserWordComponent} from './vocabulary/user-word.component';
import {WordTagsComponent} from './dict/word-tags.component';
import {WordTextComponent} from './dict/word-text.component';
import { DictComponent } from './dict/dict.component';
import { DictPhoneticsComponent } from './dict/dict-phonetics.component';
import { DictSimpleComponent } from './dict/dict-simple.component';
import { LoginPopupComponent } from './account/login-popup.component';
import { LoginComponent } from './account/login.component';
import { SessionService } from './services/session.service';
import { DictZhEntrySmiComponent } from './dict-zh/dict-zh-entry-smi.component';
import { DictZhService } from './services/dict-zh.service';

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
    LoginComponent,
    LoginPopupComponent,
    BookListComponent,
    BookComponent,
    ChapComponent,
    ParaContentComponent,
    WordAnnosComponent,
    DictComponent,
    DictEntryComponent,
    DictPhoneticsComponent,
    CreatedDatePipe,
    CreatedDateStringPipe,
    WordFamiliarityPipe,
    ApproximateNumberPipe,
    VocabularyComponent,
    BaseVocabularyComponent,
    DictSimpleComponent,
    WordTagsSettingComponent,
    UserWordComponent,
    WordTagsComponent,
    WordTextComponent,
    DictZhEntrySmiComponent
  ],
  providers: [
    AppService,
    BookService,
    ChapService,
    ParaService,
    DictService,
    UserBookService,
    UserWordService,
    WordCategoryService,
    UserVocabularyService,
    UserPreferenceService,
    AnnotationsService,
    SessionService,
    DictZhService
  ],
  entryComponents: [
    LoginPopupComponent,
    WordAnnosComponent,
    DictSimpleComponent,
    DictZhEntrySmiComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
