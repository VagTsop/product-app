import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  constructor(public router: Router
  ) { }

  ngOnInit() {

  }
  onLoginSuccess() {
    this.isLoggedIn = true;
    this.router.navigate(['/product-list']); // Navigate to product details after login
  }
}
