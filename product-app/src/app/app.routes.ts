import type { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [guestGuard],
    title: 'Sign in · Millenia Bank',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · Millenia Bank',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'accounts',
        title: 'Accounts · Millenia Bank',
        loadComponent: () => import('./features/accounts/accounts').then((m) => m.Accounts),
      },
      {
        path: 'accounts/:id',
        title: 'Account · Millenia Bank',
        loadComponent: () =>
          import('./features/accounts/account-details').then((m) => m.AccountDetails),
      },
      {
        path: 'cards',
        title: 'Cards · Millenia Bank',
        loadComponent: () => import('./features/cards/cards').then((m) => m.Cards),
      },
      {
        path: 'transfers',
        title: 'Send money · Millenia Bank',
        loadComponent: () => import('./features/transfers/transfers').then((m) => m.Transfers),
      },
      {
        path: 'transactions',
        title: 'Transactions · Millenia Bank',
        loadComponent: () =>
          import('./features/transactions/transactions').then((m) => m.Transactions),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
