import { Component, OnInit } from '@angular/core';
import { VipTerm } from '../models/vip';
import { VipTermService } from '../services/vip-term.service';

@Component({
  selector: 'vip-terms',
  templateUrl: './vip-terms.component.html',
})
export class VipTermsComponent implements OnInit {

  vipTerms: VipTerm[];

  constructor(private vipTermService: VipTermService) {
  }

  ngOnInit() {
    this.vipTermService.list()
      .subscribe(vts => this.vipTerms = vts.filter(v => v.status !== 'E'));
  }
}
