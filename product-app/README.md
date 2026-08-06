# Millenia Bank — Web Application

A full rebuild of the original Angular 14 *Millenia Bank* demo, rewritten on **Angular 20**
with standalone components, signals, zoneless change detection and a hand-built design
system on top of **Tailwind CSS v4**.

> Demo credentials: **admin / 123** (or `user / 123`).

```bash
npm install
npm start          # http://localhost:4200
```

---

## What changed vs. the original

| | Original (`../product-app`) | This rebuild |
| --- | --- | --- |
| Angular | 14, NgModules | 20, standalone + lazy routes |
| Change detection | Zone.js | **Zoneless** (`provideZonelessChangeDetection`) |
| State | `any` fields + manual `subscribe` | Signals, `computed`, `linkedSignal`, `httpResource` |
| Layout | `@angular/flex-layout` (deprecated) | CSS grid/flex + Tailwind v4 |
| UI kit | Angular Material 13 prebuilt theme | Custom components, no UI dependency |
| Templates | `*ngIf` / `*ngFor` | Built-in control flow (`@if`, `@for`, `@let`) |
| Screens | Login, product list, product details | + Dashboard, Cards, Transfers, Transactions |
| Theming | Single light theme | Light **and** dark, persisted, no flash of wrong theme |
| Language | English only | English + Greek, switchable at runtime |
| Charts | none | Area, donut and bar charts written from scratch in SVG/CSS |

## Features

- **Dashboard** — net-worth hero with an animated trend line, month-on-month spend
  comparison clipped to the same day (so a partial month doesn't read as −100%),
  12-month cash-flow bars and a category donut.
- **Accounts** — grouped by product family with per-group totals; detail view with
  running balances, IBAN copy, inline rename, loan repayment and credit-limit progress.
- **Cards** — 3D flip to reveal PAN/CVV, freeze/unfreeze, contactless and online-payment
  switches, live monthly-limit slider.
- **Transfers** — three-step wizard with real **IBAN MOD-97 validation**, balance checks,
  saved payees, review step and a confirmation screen.
- **Transactions** — search, direction and category filters, day grouping with daily
  totals, pagination, and CSV export of exactly what is filtered.
- **Dark mode** and **EN/EL** switching, both persisted and applied before first paint.
- Reduced-motion support, `aria-*` on every control, visible focus rings.

## Architecture

```
src/app/
├─ core/
│  ├─ data/          deterministic transaction generator (seeded PRNG)
│  ├─ guards/        functional CanMatch guards
│  ├─ i18n/          signal-based translation service + EN/EL dictionaries
│  ├─ models/        readonly domain types
│  └─ services/      BankingStore, AuthService, ThemeService, ToastService
├─ features/         lazy-loaded routed pages
├─ layout/           app shell (rail, drawer, bottom tabs)
└─ shared/
   ├─ charts/        area, donut and bar charts
   ├─ ui/            icon set, tiles, transaction list, toasts, toggles
   ├─ util/          formatting, category/product metadata
   └─ validators/    IBAN + amount validators
```

`BankingStore` is the single source of truth. The seed document is fetched with
`httpResource`, and every mutable slice (`accounts`, `cards`, `payees`) is a
`linkedSignal` on top of it — local edits survive until the resource reloads, with no
manual subscription bookkeeping. Aggregates (net worth, monthly flow, category
breakdown) are plain `computed`s, so a transfer instantly ripples through every chart.

Transactions are synthesised by a seeded mulberry32 PRNG so the statement is identical
on every reload — stable for screenshots and tests — then balances are back-filled from
each account's current balance so every row's running total is consistent.

## Design system

Tokens live in `src/styles.css` as Tailwind v4 `@theme` variables plus a light/dark pair
of CSS custom properties. Everything else — cards, glass surfaces, the aurora mesh,
gradient brand fills, the stagger animation — is a small utility layer on top.

## Data

`public/data/bank.json` holds the accounts, cards, payees, merchant catalogue and
recurring items. Nothing leaves the browser; there is no backend.
