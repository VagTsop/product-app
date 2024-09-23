import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  username: string = '';

  constructor(public router: Router
  ) { }

  ngOnInit() {

  }
  onLoginSuccess(username: string) {
    this.isLoggedIn = true;
    this.username = username;  // Store the username
    this.router.navigate(['/product-list']); // Navigate to product details after login
  }
}
