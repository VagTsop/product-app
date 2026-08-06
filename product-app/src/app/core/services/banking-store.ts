import { computed, Injectable, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

import {
  buildTransactions,
  type MerchantSeed,
  type RecurringSeed,
} from '../data/transaction-factory';
import type {
  Account,
  Card,
  CategorySlice,
  CurrencyCode,
  MonthlyFlow,
  Payee,
  Transaction,
  TransactionCategory,
  Transfer,
  User,
} from '../models/banking.models';

interface BankData {
  user: User;
  accounts: Account[];
  cards: Card[];
  payees: Payee[];
  merchants: MerchantSeed[];
  recurring: RecurringSeed[];
}

/** Indicative rates against EUR — enough for a demo consolidated balance. */
const FX_TO_EUR: Record<CurrencyCode, number> = { EUR: 1, USD: 0.92, GBP: 1.17 };

export function toEur(amount: number, currency: CurrencyCode): number {
  return amount * FX_TO_EUR[currency];
}

const MONTHS_OF_HISTORY = 12;

/**
 * Resolved against `<base href>` so the seed document is found both at the site
 * root in development and under `/product-app/` on GitHub Pages.
 */
const SEED_URL = new URL('data/bank.json', document.baseURI).toString();

/**
 * Single source of truth for the banking domain.
 *
 * The seed document is fetched with `httpResource`, and every mutable slice is
 * a `linkedSignal` on top of it — so local edits (freezing a card, sending a
 * transfer) survive until the underlying resource reloads, without any manual
 * subscription bookkeeping.
 */
@Injectable({ providedIn: 'root' })
export class BankingStore {
  private readonly data = httpResource<BankData>(() => SEED_URL);

  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => this.data.error());

  readonly profile = computed<User | null>(() => this.data.value()?.user ?? null);

  readonly accounts = linkedSignal<Account[]>(() => this.data.value()?.accounts ?? []);
  readonly cards = linkedSignal<Card[]>(() => this.data.value()?.cards ?? []);
  readonly payees = linkedSignal<Payee[]>(() => this.data.value()?.payees ?? []);

  /** Transactions synthesised once per data load, then appended to locally. */
  private readonly seededTransactions = computed<Transaction[]>(() => {
    const data = this.data.value();
    if (!data) return [];
    return buildTransactions({
      accounts: data.accounts,
      merchants: data.merchants,
      recurring: data.recurring,
      months: MONTHS_OF_HISTORY,
      now: new Date(),
    });
  });

  private readonly localTransactions = signal<Transaction[]>([]);

  readonly transactions = computed<Transaction[]>(() =>
    [...this.localTransactions(), ...this.seededTransactions()].sort(
      (a, b) => Date.parse(b.date) - Date.parse(a.date),
    ),
  );

  // ---------------------------------------------------------------- lookups

  account(id: string) {
    return computed(() => this.accounts().find((a) => a.id === id) ?? null);
  }

  card(id: string) {
    return computed(() => this.cards().find((c) => c.id === id) ?? null);
  }

  transactionsFor(accountId: string) {
    return computed(() => this.transactions().filter((t) => t.accountId === accountId));
  }

  cardsFor(accountId: string) {
    return computed(() => this.cards().filter((c) => c.accountId === accountId));
  }

  // ------------------------------------------------------------ aggregates

  readonly assets = computed(() =>
    this.accounts()
      .filter((a) => a.balance > 0)
      .reduce((sum, a) => sum + toEur(a.balance, a.currency), 0),
  );

  readonly liabilities = computed(() =>
    this.accounts()
      .filter((a) => a.balance < 0)
      .reduce((sum, a) => sum + Math.abs(toEur(a.balance, a.currency)), 0),
  );

  readonly netWorth = computed(() => this.assets() - this.liabilities());

  /** Money in / money out per calendar month, oldest → newest. */
  readonly monthlyFlow = computed<MonthlyFlow[]>(() => {
    const buckets = new Map<string, { income: number; spend: number }>();
    const now = new Date();

    for (let back = MONTHS_OF_HISTORY - 1; back >= 0; back--) {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
      buckets.set(monthKey(d), { income: 0, spend: 0 });
    }

    for (const t of this.transactions()) {
      const key = monthKey(new Date(t.date));
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const eur = toEur(t.amount, t.currency);
      if (eur >= 0) bucket.income += eur;
      else bucket.spend += Math.abs(eur);
    }

    return [...buckets.entries()].map(([month, v]) => ({
      month,
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString('en', { month: 'short' }),
      income: Math.round(v.income),
      spend: Math.round(v.spend),
    }));
  });

  /** Net-worth trajectory derived by unwinding monthly net flow from today. */
  readonly netWorthTrend = computed<number[]>(() => {
    const flows = this.monthlyFlow();
    const series: number[] = [];
    let value = this.netWorth();
    for (let i = flows.length - 1; i >= 0; i--) {
      series.unshift(Math.round(value));
      value -= flows[i].income - flows[i].spend;
    }
    return series;
  });

  /** Spend by category for the current calendar month. */
  readonly spendByCategory = computed<CategorySlice[]>(() => {
    const key = monthKey(new Date());
    const totals = new Map<TransactionCategory, number>();

    for (const t of this.transactions()) {
      if (t.amount >= 0 || monthKey(new Date(t.date)) !== key) continue;
      const eur = Math.abs(toEur(t.amount, t.currency));
      totals.set(t.category, (totals.get(t.category) ?? 0) + eur);
    }

    const grand = [...totals.values()].reduce((s, n) => s + n, 0);
    return [...totals.entries()]
      .map(([category, total]) => ({
        category,
        total: Math.round(total),
        share: grand ? total / grand : 0,
      }))
      .sort((a, b) => b.total - a.total);
  });

  readonly monthSpend = computed(() =>
    this.spendByCategory().reduce((sum, s) => sum + s.total, 0),
  );

  readonly monthIncome = computed(() => {
    const flows = this.monthlyFlow();
    return flows.length ? flows[flows.length - 1].income : 0;
  });

  /**
   * Month-on-month spending change. The current month is only partly elapsed,
   * so the comparison window on the previous month is clipped to the same day
   * — otherwise every month would open at −100%.
   */
  readonly spendDelta = computed(() => {
    const now = new Date();
    const dayCutoff = now.getDate();
    const thisMonth = monthKey(now);
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    let current = 0;
    let previous = 0;

    for (const t of this.transactions()) {
      if (t.amount >= 0) continue;
      const date = new Date(t.date);
      const key = monthKey(date);
      const eur = Math.abs(toEur(t.amount, t.currency));
      if (key === thisMonth) current += eur;
      else if (key === lastMonth && date.getDate() <= dayCutoff) previous += eur;
    }

    return previous ? (current - previous) / previous : 0;
  });

  // -------------------------------------------------------------- mutations

  toggleCardFreeze(cardId: string): boolean {
    let frozen = false;
    this.cards.update((cards) =>
      cards.map((c) => {
        if (c.id !== cardId) return c;
        frozen = !c.frozen;
        return { ...c, frozen };
      }),
    );
    return frozen;
  }

  updateCard(cardId: string, patch: Partial<Pick<Card, 'contactless' | 'onlinePayments' | 'monthlyLimit'>>): void {
    this.cards.update((cards) => cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)));
  }

  renameAccount(accountId: string, nickname: string): void {
    this.accounts.update((accounts) =>
      accounts.map((a) => (a.id === accountId ? { ...a, nickname: nickname.trim() || null } : a)),
    );
  }

  /** Executes a transfer: debits the source account and books a transaction. */
  executeTransfer(transfer: Transfer): Transaction {
    const now = new Date();
    const booked: Transaction = {
      id: `t-local-${now.getTime()}`,
      accountId: transfer.fromAccountId,
      reference: crypto.randomUUID(),
      date: now.toISOString(),
      merchant: transfer.payeeName,
      description: transfer.reference || 'Outgoing transfer',
      amount: -Math.abs(transfer.amount),
      currency: transfer.currency,
      category: 'transfer',
      status: Date.parse(transfer.executeOn) > now.getTime() ? 'pending' : 'booked',
      balanceAfter: null,
    };

    this.localTransactions.update((list) => [booked, ...list]);

    this.accounts.update((accounts) =>
      accounts.map((a) =>
        a.id === transfer.fromAccountId
          ? {
              ...a,
              balance: round2(a.balance - Math.abs(transfer.amount)),
              available: round2(a.available - Math.abs(transfer.amount)),
            }
          : a,
      ),
    );

    if (transfer.savePayee && !transfer.payeeId) {
      this.payees.update((list) => [
        {
          id: `p-local-${now.getTime()}`,
          name: transfer.payeeName,
          iban: transfer.iban,
          bank: 'Unknown bank',
          favourite: false,
          lastUsed: now.toISOString().slice(0, 10),
          initials: initialsOf(transfer.payeeName),
        },
        ...list,
      ]);
    } else if (transfer.payeeId) {
      this.payees.update((list) =>
        list.map((p) =>
          p.id === transfer.payeeId ? { ...p, lastUsed: now.toISOString().slice(0, 10) } : p,
        ),
      );
    }

    return booked;
  }

  reload(): void {
    this.localTransactions.set([]);
    this.data.reload();
  }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}
