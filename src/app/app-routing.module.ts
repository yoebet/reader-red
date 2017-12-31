import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {BooksComponent} from './book/books.component';
import {BookComponent} from './book/book.component';
import {ChapComponent} from './chap/chap.component';
import {VocabularyComponent} from './vocabulary/vocabulary.component';

const routes: Routes = [
  {path: 'books', component: BooksComponent},
  {path: 'books/:id', component: BookComponent},
  {path: 'chaps/:id', component: ChapComponent},
  {path: 'vocabulary', component: VocabularyComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
