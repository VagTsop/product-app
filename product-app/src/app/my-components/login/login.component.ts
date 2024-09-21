import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from 'src/model/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, OnDestroy {
  @Output() loginSuccess = new EventEmitter<void>();
  loginForm: FormGroup;
  password: string = 'password';
  show: boolean = false;

  constructor(private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],  // Add validators as needed
      password: ['', [Validators.required]],
    });
  }



  onLogin(): void {
    if (this.loginForm.valid) {
      const username = this.loginForm.get('username')?.value;
      const password = this.loginForm.get('password')?.value;

      // Check for specific username and navigate
      if (username === 'admin' && password === '123') {  // Change 'admin' to your desired username
        console.log('Login successful for admin');
        this.loginSuccess.emit(); // Emit event on successful login
      } else {
        console.log('Invalid username or password');
      }
    } else {
      console.log('Form is invalid.');
    }
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
