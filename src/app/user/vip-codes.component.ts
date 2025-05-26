import { Component, OnInit } from '@angular/core';
import { VipCodeService } from '../services/vip-code.service';
import { VipCode } from '../models/vip';

@Component({
  selector: 'user-home',
  templateUrl: './vip-codes.component.html',
})
export class VipCodesComponent implements OnInit {

  vipCodes: VipCode[];

  constructor(private vipCodeService: VipCodeService) {
  }

  ngOnInit() {
    this.vipCodeService.listBoughtCodes()
      .subscribe(vcs => this.vipCodes = vcs);
  }
}
