import { inject, Injectable } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type { CurrencyCode } from '../../core/models/banking.models';

/**
 * Locale-aware formatting. Methods read the language signal, so any template
 * that calls them re-renders automatically when the user switches language.
 */
@Injectable({ providedIn: 'root' })
export class FormatService {
  private readonly i18n = inject(I18nService);

  readonly money = (
    amount: number,
    currency: CurrencyCode = 'EUR',
    options: { signed?: boolean; decimals?: boolean } = {},
  ): string => {
    const { signed = false, decimals = true } = options;
    const formatted = new Intl.NumberFormat(this.i18n.locale(), {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    }).format(Math.abs(amount));
    if (!signed) return amount < 0 ? `−${formatted}` : formatted;
    return `${amount < 0 ? '−' : '+'}${formatted}`;
  };

  readonly compact = (amount: number, currency: CurrencyCode = 'EUR'): string =>
    new Intl.NumberFormat(this.i18n.locale(), {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);

  readonly percent = (fraction: number, digits = 1): string =>
    new Intl.NumberFormat(this.i18n.locale(), {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(fraction);

  readonly date = (iso: string, style: 'short' | 'long' | 'time' = 'short'): string => {
    const d = new Date(iso);
    if (style === 'time') {
      return d.toLocaleTimeString(this.i18n.locale(), { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(this.i18n.locale(), {
      day: '2-digit',
      month: style === 'long' ? 'long' : 'short',
      year: 'numeric',
    });
  };

  /** "Today" / "Yesterday" / a full date — used for transaction day headers. */
  readonly dayHeading = (iso: string): string => {
    const d = new Date(iso);
    const today = new Date();
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
    if (diffDays === 0) return this.i18n.t('tx.today');
    if (diffDays === 1) return this.i18n.t('tx.yesterday');
    return d.toLocaleDateString(this.i18n.locale(), {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  };

  /** Masks all but the last four digits: "•••• •••• •••• 8593". */
  readonly maskCard = (pan: string): string => {
    const digits = pan.replace(/\s/g, '');
    return `•••• •••• •••• ${digits.slice(-4)}`;
  };

  /** Groups an IBAN into blocks of four for readability. */
  readonly iban = (value: string): string =>
    value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();

  readonly maskIban = (value: string): string => {
    const clean = value.replace(/\s/g, '');
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  };
}
