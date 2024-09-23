import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from 'src/model/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, OnDestroy {
  @Output() loginSuccess = new EventEmitter<string>();  // Emit username as a string
  loginForm: FormGroup;
  password: string = 'password';
  show: boolean = false;
  user: User;

  constructor(private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.user = new User();
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const username = this.loginForm.get('username')?.value;
      const password = this.loginForm.get('password')?.value;
      if ((username === 'admin' || username === 'user') && password === '123') {
        console.log('Login successful for' + username);
        this.loginSuccess.emit(username);
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
