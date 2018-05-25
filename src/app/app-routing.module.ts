import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {BookListComponent} from './book/book-list.component';
import {BookComponent} from './book/book.component';
import {ChapComponent} from './chap/chap.component';
import {VocabularyComponent} from './vocabulary/vocabulary.component';
import {BaseVocabularyComponent} from './vocabulary/base-vocabulary.component';

const routes: Routes = [
  {path: 'books', component: BookListComponent},
  {path: 'books/:id', component: BookComponent},
  {path: 'chaps/:id', component: ChapComponent},
  {path: 'vocabulary', component: VocabularyComponent},
  {path: 'base_vocabulary', component: BaseVocabularyComponent}
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
