import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from 'src/model/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, OnDestroy {

  password: string;
  show = false;

  constructor() { }

  ngOnInit(): void { }



  onLogin(user: User): void {

  }

  onClick() {
    if (this.password === 'password') {
      this.password = 'text';
      this.show = true;
    } else {
      this.password = 'password';
      this.show = false;
    }
  }


  ngOnDestroy() { }
}
