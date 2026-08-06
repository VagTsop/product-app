# Millenia Bank Web Application

A digital-banking demo built with **Angular 20** — standalone components, signals,
zoneless change detection and a hand-built design system on **Tailwind CSS v4**.

**Live:** https://vagtsop.github.io/product-app/ · **Demo login:** `admin` / `123`

The application lives in [`product-app/`](product-app). See its
[README](product-app/README.md) for the architecture notes.

```bash
cd product-app
npm install
npm start            # http://localhost:4200
npm run build:pages  # production build with the GitHub Pages base href
```

## Screens

- **Dashboard** — net-worth trend, 12-month cash flow, spending breakdown, recent activity
- **Accounts** — grouped by product family; detail view with running balances, IBAN copy,
  inline rename, loan and credit-limit progress
- **Cards** — flip to reveal, freeze/unfreeze, payment controls, monthly limit
- **Transfers** — three-step wizard with IBAN MOD-97 validation and a review step
- **Transactions** — search, filters, day grouping, CSV export

Light and dark themes plus English/Greek, both persisted. No backend — all data is
seeded from `public/data/bank.json`.
