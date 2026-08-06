/** Domain model for the Millenia Bank demo. */

export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

export type ProductKind = 'current' | 'savings' | 'loan' | 'credit-card';

export type AccountStatus = 'active' | 'frozen' | 'closed';

export interface Account {
  readonly id: string;
  readonly kind: ProductKind;
  /** Product family name, e.g. "Current Account". */
  readonly title: string;
  /** User-defined nickname, shown first when present. */
  readonly nickname: string | null;
  readonly iban: string;
  readonly currency: CurrencyCode;
  readonly balance: number;
  /** Available balance for spending — differs from `balance` when funds are held. */
  readonly available: number;
  readonly status: AccountStatus;
  readonly openedAt: string;
  /** Loans only: original principal. */
  readonly principal?: number;
  /** Loans only: annual interest rate as a fraction (0.043 = 4.3%). */
  readonly interestRate?: number;
  /** Loans only: monthly instalment. */
  readonly instalment?: number;
  /** Credit cards only: total credit limit. */
  readonly creditLimit?: number;
}

export type TransactionCategory =
  | 'income'
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'travel'
  | 'transfer';

export type TransactionStatus = 'booked' | 'pending' | 'declined';

export interface Transaction {
  readonly id: string;
  readonly accountId: string;
  readonly reference: string;
  /** ISO 8601 timestamp. */
  readonly date: string;
  readonly merchant: string;
  readonly description: string;
  /** Negative for debits, positive for credits. */
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly category: TransactionCategory;
  readonly status: TransactionStatus;
  /** Running balance after the transaction, when known. */
  readonly balanceAfter: number | null;
}

export type CardNetwork = 'visa' | 'mastercard';
export type CardKind = 'physical' | 'virtual';

export interface Card {
  readonly id: string;
  readonly accountId: string;
  readonly holder: string;
  /** Full PAN — masked in the UI until the user reveals it. */
  readonly number: string;
  readonly expiry: string;
  readonly cvv: string;
  readonly network: CardNetwork;
  readonly kind: CardKind;
  readonly frozen: boolean;
  readonly contactless: boolean;
  readonly onlinePayments: boolean;
  /** Monthly spending limit in the card's currency. */
  readonly monthlyLimit: number;
  readonly spentThisMonth: number;
  readonly currency: CurrencyCode;
}

export interface Payee {
  readonly id: string;
  readonly name: string;
  readonly iban: string;
  readonly bank: string;
  readonly favourite: boolean;
  readonly lastUsed: string | null;
  readonly initials: string;
}

export interface Transfer {
  readonly fromAccountId: string;
  readonly payeeId: string | null;
  readonly payeeName: string;
  readonly iban: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly reference: string;
  readonly executeOn: string;
  readonly savePayee: boolean;
}

export interface User {
  readonly id: string;
  readonly username: string;
  readonly fullName: string;
  readonly email: string;
  readonly since: string;
  readonly tier: 'Classic' | 'Gold' | 'Private';
}

/** Chart-ready aggregate: one bucket of spend for a category. */
export interface CategorySlice {
  readonly category: TransactionCategory;
  readonly total: number;
  readonly share: number;
}

/** Chart-ready aggregate: money in/out for a calendar month. */
export interface MonthlyFlow {
  readonly month: string;
  readonly label: string;
  readonly income: number;
  readonly spend: number;
}
