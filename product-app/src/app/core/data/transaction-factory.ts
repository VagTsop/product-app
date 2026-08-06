import type {
  Account,
  CurrencyCode,
  Transaction,
  TransactionCategory,
  TransactionStatus,
} from '../models/banking.models';

export interface MerchantSeed {
  name: string;
  description: string;
  category: TransactionCategory;
  min: number;
  max: number;
  weight: number;
}

export interface RecurringSeed {
  merchant: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  dayOfMonth: number;
}

/**
 * Deterministic PRNG (mulberry32). A fixed seed keeps the demo statement
 * identical across reloads, which matters for screenshots and tests.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEX = '0123456789abcdef';

function reference(rand: () => number): string {
  let out = '';
  for (let i = 0; i < 24; i++) {
    if (i === 8 || i === 12 || i === 16) out += '-';
    out += HEX[Math.floor(rand() * 16)];
  }
  return out;
}

function pickWeighted(merchants: MerchantSeed[], rand: () => number): MerchantSeed {
  const total = merchants.reduce((sum, m) => sum + m.weight, 0);
  let ticket = rand() * total;
  for (const m of merchants) {
    ticket -= m.weight;
    if (ticket <= 0) return m;
  }
  return merchants[merchants.length - 1];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface FactoryOptions {
  accounts: Account[];
  merchants: MerchantSeed[];
  recurring: RecurringSeed[];
  /** How many months of history to synthesise, including the current one. */
  months: number;
  /** "Today" — injectable so the statement is stable in tests. */
  now: Date;
}

/**
 * Builds a believable statement: weighted day-to-day card spend on the two
 * current accounts plus fixed monthly items (salary, rent, mortgage, savings).
 * Balances are back-filled so the newest transaction matches the account's
 * current balance and every earlier row shows the balance that led to it.
 */
export function buildTransactions(options: FactoryOptions): Transaction[] {
  const { accounts, merchants, recurring, months, now } = options;
  const rand = mulberry32(0x4d494c4c); // "MILL"
  const spendable = accounts.filter((a) => a.kind === 'current' || a.kind === 'credit-card');
  const rows: Transaction[] = [];
  let sequence = 9000;

  const nextId = () => `t-${sequence++}`;

  for (let back = months - 1; back >= 0; back--) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = back === 0 ? now.getDate() : daysInMonth;

    // Fixed monthly items land on the main EUR current account.
    for (const item of recurring) {
      if (item.dayOfMonth > lastDay) continue;
      rows.push({
        id: nextId(),
        accountId: 'acc-eur-current',
        reference: reference(rand),
        date: new Date(year, month, item.dayOfMonth, 8, 12, 0).toISOString(),
        merchant: item.merchant,
        description: item.description,
        amount: round2(item.amount * (0.985 + rand() * 0.03)),
        currency: 'EUR',
        category: item.category,
        status: 'booked',
        balanceAfter: null,
      });
    }

    // Day-to-day spending.
    const dailyCount = 2 + Math.floor(rand() * 3);
    for (let day = 1; day <= lastDay; day++) {
      for (let i = 0; i < dailyCount; i++) {
        if (rand() > 0.55) continue;
        const merchant = pickWeighted(merchants, rand);
        const account = spendable[Math.floor(rand() * spendable.length)];
        const gross = merchant.min + rand() * (merchant.max - merchant.min);
        const hoursIn = 7 + Math.floor(rand() * 15);
        const date = new Date(year, month, day, hoursIn, Math.floor(rand() * 60), 0);
        if (date > now) continue;

        const isRecent = now.getTime() - date.getTime() < 36 * 3600 * 1000;
        const status: TransactionStatus = isRecent && rand() > 0.7 ? 'pending' : 'booked';

        rows.push({
          id: nextId(),
          accountId: account.id,
          reference: reference(rand),
          date: date.toISOString(),
          merchant: merchant.name,
          description: merchant.description,
          amount: -round2(gross),
          currency: account.currency,
          category: merchant.category,
          status,
          balanceAfter: null,
        });
      }
    }
  }

  rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return backfillBalances(rows, accounts);
}

/** Walks each account's rows newest → oldest, reconstructing the running balance. */
function backfillBalances(rows: Transaction[], accounts: Account[]): Transaction[] {
  const running = new Map<string, number>(accounts.map((a) => [a.id, a.balance]));
  return rows.map((row) => {
    const current = running.get(row.accountId);
    if (current === undefined || row.status !== 'booked') return row;
    running.set(row.accountId, round2(current - row.amount));
    return { ...row, balanceAfter: round2(current) };
  });
}

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};
