import {Component, Input, OnInit} from "@angular/core";
import {VocabularyService} from "../services/vocabulary.service";
import {UserWord} from "../models/user-word";
import {OpResult} from "../models/op-result";

@Component({
  selector: 'user-word',
  templateUrl: './user-word.component.html',
  styleUrls: ['./user-word.component.css']
})
export class UserWordComponent implements OnInit {
  @Input() word: string;
  @Input() userWord: UserWord;
  @Input() context: any;


  constructor(private vocaService: VocabularyService) {

  }

  ngOnInit() {

  }


  addToVocabulary() {
    let uw = new UserWord();
    uw.word = this.word;
    if (this.context) {
      uw.bookId = this.context.bookId;
      uw.chapId = this.context.chapId;
      uw.paraId = this.context.paraId;
    }
    this.vocaService.create(uw)
      .subscribe(_ => this.userWord = uw);
  }

  familiarityUp() {
    if (this.userWord.familiarity < 3) {
      this.userWord.familiarity++;
      this.vocaService.update(this.userWord)
        .subscribe(() => {
        });
    }
  }

  familiarityDown() {
    if (this.userWord.familiarity > 1) {
      this.userWord.familiarity--;
      this.vocaService.update(this.userWord)
        .subscribe(() => {
        });
    }
  }

  removeUserWord() {
    if (!confirm('确定要移除吗？')) {
      return;
    }
    this.vocaService.remove(this.userWord.word).subscribe((opr: OpResult) => {
      if (opr.ok === 1) {
        // this.onUserWordRemoved.emit(this.userWord);
        this.userWord = null;
      }
    });
  }
}
