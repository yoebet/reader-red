import { Component, OnInit } from '@angular/core';
import { ComponentModalConfig } from 'ng2-semantic-ui';
import { ModalSize } from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';
import { UserVocabularyService } from '../services/user-vocabulary.service';

@Component({
  selector: 'word-statistic',
  templateUrl: './word-statistic.component.html',
  styleUrls: ['./word-statistic.component.css']
})
export class WordStatisticComponent implements OnInit {

  wordStatistic: Object;

  constructor(
    protected userVocabularyService: UserVocabularyService) {
  }

  ngOnInit() {
    this.userVocabularyService.statistic()
      .subscribe(statistic => {
        this.wordStatistic = statistic;
      });
  }
}

export class WordStatisticModal extends ComponentModalConfig<string> {
  constructor(context: string) {
    super(WordStatisticComponent, context, false);
    this.size = ModalSize.Tiny;
    this.mustScroll = true;
    this.isClosable = true;
  }
}
