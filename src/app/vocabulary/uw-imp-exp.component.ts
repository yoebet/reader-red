import { Component, OnInit } from '@angular/core';
import { SuiModalService } from 'ng2-semantic-ui';
import { groupBy } from 'lodash';
import { UserWordService } from '../services/user-word.service';
import { UserWord, UserWordStat } from '../models/user-word';
import { ImpConfirmModal } from './imp-confirm.component';

@Component({
  selector: 'uw-imp-exp',
  templateUrl: './uw-imp-exp.component.html',
  // styleUrls: ['./uw-imp-exp.component.css']
})
export class UwImpExpComponent implements OnInit {

  wordsText0: string;
  wordsText: string;
  stat: UserWordStat = {
    all: 0,
    f1: 0,
    f2: 0,
    f3: 0,
  };

  constructor(protected userWordService: UserWordService,
              protected modalService: SuiModalService) {
  }

  ngOnInit() {
    this.userWordService.loadAll().subscribe(this.analyzeWords.bind(this));
  }

  private calWords(userWords: { familiarity: number }[]): UserWordStat {
    const groups = groupBy(userWords, 'familiarity');
    let f1Count = (groups['1'] || []).length;
    let f2Count = (groups['2'] || []).length;
    let f3Count = (groups['3'] || []).length;
    let allCount = f1Count + f2Count + f3Count;
    return {
      all: allCount,
      f1: f1Count,
      f2: f2Count,
      f3: f3Count,
    };
  }

  private buildWordsText(userWords: UserWord[]) {
    const lines: string[][] = [];
    let line: string[];
    const wordsEachLine = 10;
    for (let i = 0; i < userWords.length; i++) {
      if (i % wordsEachLine === 0) {
        if (line) {
          lines.push(line);
        }
        line = [];
      }
      const { word, familiarity } = userWords[i];
      let wordWithF = familiarity === 1 ? word : `${word}:${familiarity}`;
      line.push(wordWithF);
    }
    if (line) {
      lines.push(line);
    }
    return lines.map(line => line.join(',')).join('\n');
  }

  private analyzeWords(userWords: UserWord[]) {
    this.wordsText = this.buildWordsText(userWords);
    this.wordsText0 = this.wordsText;
    this.stat = this.calWords(userWords);
  }

  importCheck() {
    const userWords: { word: string, familiarity: number }[] = [];
    const wfs = this.wordsText.split(/[,，。|/\n]/)
      .map(w => w.trim().replace(/\s+/g, ' '));
    const ignored: string[] = [];
    for (const wf of wfs) {
      const [word, f] = wf.split(':');
      if (
        !/^[a-z ]+$/i.test(word) ||
        word.length < 3 ||
        (!word.includes(' ') && word.length > 20) ||
        (word.includes(' ') && word.length > 30)
      ) {
        ignored.push(word);
        continue;
      }
      const fm = f ? +f : 1;
      if (isNaN(fm) || fm < 1 || fm > 3) {
        ignored.push(word);
        continue;
      }
      userWords.push({ word, familiarity: fm });
    }
    const stat = this.calWords(userWords);
    this.modalService.open(new ImpConfirmModal({ stat, ignored }))
      .onApprove(result => {
        this.doImport(userWords);
      });
  }

  private doImport(userWords: { word: string, familiarity: number }[]) {
    this.userWordService.resetAll(userWords).subscribe(opr => {
      if (!opr) {
        return;
      }
      if (!opr.ok) {
        alert(opr.message || '导入失败');
        return;
      }
      alert('导入成功');
      this.userWordService.reloadAll().subscribe(this.analyzeWords.bind(this));
    });
  }

  private download(text: string, filename: string) {
    let element = document.createElement('a');
    text = encodeURIComponent(text);
    element.setAttribute('href', `data:text/plain;charset=utf-8,${text}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  exportWords() {
    if (!this.wordsText0) {
      alert(`词表是空的`);
      return;
    }
    const d = new Date();
    const ds = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    this.download(this.wordsText0, `words_${ds}.txt`);
  }
}
