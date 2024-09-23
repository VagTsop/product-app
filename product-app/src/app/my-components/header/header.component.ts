import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() username: string = '';

  constructor(public router: Router) { }

  ngOnInit(): void {
  }

  ngOnDestroy() { }
}
