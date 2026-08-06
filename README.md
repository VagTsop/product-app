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

## Deployment

Every push to `master` that touches the app triggers
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and
commits the output to the `gh-pages` branch — the branch GitHub Pages serves from. The
run can also be started by hand from the **Actions** tab (*Run workflow*).

The workflow adds two files the built bundle does not contain:

- `404.html`, a copy of `index.html`, so deep links such as `/product-app/cards` still
  boot the app after a refresh (Pages serves `404.html` for unknown paths).
- `.nojekyll`, so Pages does not run the output through Jekyll.

It publishes with a normal commit rather than a force-push, so the `gh-pages` history is
kept, and it skips the commit entirely when the build output is unchanged.

## Screens

- **Dashboard** — net-worth trend, 12-month cash flow, spending breakdown, recent activity
- **Accounts** — grouped by product family; detail view with running balances, IBAN copy,
  inline rename, loan and credit-limit progress
- **Cards** — flip to reveal, freeze/unfreeze, payment controls, monthly limit
- **Transfers** — three-step wizard with IBAN MOD-97 validation and a review step
- **Transactions** — search, filters, day grouping, CSV export

Light and dark themes plus English/Greek, both persisted. No backend — all data is
seeded from `public/data/bank.json`.
