import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BookListComponent } from './book/book-list.component';
import { BookComponent } from './book/book.component';
import { ChapComponent } from './chap/chap.component';
import { VocabularyComponent } from './vocabulary/vocabulary.component';
import { BaseVocabularyComponent } from './preference/base-vocabulary.component';
import { WordTagsSettingComponent } from './preference/word-tags-setting.component';
import { DictComponent } from './dict/dict.component';
import { ChapReaderComponent } from './chap/chap-reader.component';
import { AppAComponent } from './app-a.component';
import { RegisterComponent } from './account/register.component';
import { UwImpExpComponent } from './vocabulary/uw-imp-exp.component';
import { HomeComponent } from './home.component';

const routes: Routes = [
  { path: 'm/:id', component: ChapReaderComponent },
  {
    path: '', component: AppAComponent, children: [
      { path: '', pathMatch: 'full', component: HomeComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'books', component: BookListComponent },
      { path: 'books/:id', component: BookComponent },
      { path: 'chaps/:id', component: ChapComponent },
      { path: 'dict', component: DictComponent },
      { path: 'vocabulary', component: VocabularyComponent },
      { path: 'imp-exp', component: UwImpExpComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'word-tags', component: WordTagsSettingComponent }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // enableTracing: true,
    useHash: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
