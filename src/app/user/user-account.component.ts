import { Component, OnInit } from '@angular/core';
import { SessionService } from '../services/session.service';
import { User } from '../models/user';
import { UserProfileService } from '../services/user-profile.service';

@Component({
  selector: 'user-home',
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.css']
})
export class UserAccountComponent implements OnInit {
  user: User;

  constructor(protected sessionService: SessionService,
              protected userProfileService: UserProfileService
  ) {
    this.user = { ...this.sessionService.currentUser };
  }

  ngOnInit() {
    this.userProfileService.getUserDetail()
      .subscribe(userDetail => {
        if (userDetail) {
          Object.assign(this.user, userDetail);
        }
      });
  }
}
