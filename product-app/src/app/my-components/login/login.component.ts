import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/model/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  password: string = 'password';
  show: boolean = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],  // Add validators as needed
      password: ['', [Validators.required]],
    });
  }



  onLogin(): void {
    if (this.loginForm.valid) {
      console.log('Form submitted.');
      console.log('User data:', this.loginForm.value);
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
