import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Transaction, TransactionCategory } from '../../core/models/banking.models';
import { ToastService } from '../../core/services/toast.service';
import { CATEGORY_META } from '../util/categories';
import { FormatService } from '../util/format.service';
import { Icon } from './icon';
import { TransactionRow } from './transaction-row';

type Direction = 'all' | 'in' | 'out';

interface DayGroup {
  readonly key: string;
  readonly heading: string;
  readonly total: number;
  readonly items: Transaction[];
}

const PAGE_SIZE = 25;

/**
 * Searchable, filterable statement view. All filtering is derived state, so
 * typing re-runs a single computed instead of mutating an array.
 */
@Component({
  selector: 'app-transaction-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, TransactionRow],
  host: { class: 'block' },
  template: `
    <div class="card overflow-hidden">
      <!-- toolbar -->
      <div class="flex flex-wrap items-center gap-3 border-b p-4" style="border-color: var(--hairline)">
        <div
          class="flex h-11 min-w-[220px] flex-1 items-center gap-2.5 rounded-xl border px-3.5 text-[var(--ink-faint)] transition focus-within:border-[var(--color-brand-500)]"
          style="border-color: var(--hairline); background: var(--surface-sunken)"
        >
          <app-icon name="search" [size]="17" />
          <input
            type="search"
            class="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-[var(--ink)] outline-none"
            [placeholder]="t('tx.search')"
            [value]="query()"
            (input)="onQuery($event)"
            [attr.aria-label]="t('tx.search')"
          />
        </div>

        <div
          class="flex h-11 items-center rounded-xl border p-1"
          style="border-color: var(--hairline); background: var(--surface-sunken)"
          role="group"
        >
          @for (option of directions; track option.value) {
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200"
              [style.background]="direction() === option.value ? 'var(--surface-raised)' : 'transparent'"
              [style.color]="direction() === option.value ? 'var(--ink)' : 'var(--ink-faint)'"
              [style.box-shadow]="direction() === option.value ? 'var(--shadow-card)' : 'none'"
              [attr.aria-pressed]="direction() === option.value"
              (click)="setDirection(option.value)"
            >
              {{ t(option.key) }}
            </button>
          }
        </div>

        <button
          type="button"
          class="flex h-11 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold text-[var(--ink-soft)] transition hover:bg-[var(--surface-sunken)]"
          style="border-color: var(--hairline)"
          (click)="exportCsv()"
        >
          <app-icon name="download" [size]="16" />
          <span class="hidden sm:inline">{{ t('tx.export') }}</span>
        </button>
      </div>

      <!-- category chips -->
      @if (categories().length > 1) {
        <div class="no-scrollbar flex gap-2 overflow-x-auto border-b px-4 py-3" style="border-color: var(--hairline)">
          @for (category of categories(); track category) {
            <button
              type="button"
              class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200"
              [style.border-color]="selected().has(category) ? color(category) : 'var(--hairline)'"
              [style.background]="
                selected().has(category)
                  ? 'color-mix(in oklab, ' + color(category) + ' 16%, transparent)'
                  : 'transparent'
              "
              [style.color]="selected().has(category) ? color(category) : 'var(--ink-soft)'"
              [attr.aria-pressed]="selected().has(category)"
              (click)="toggleCategory(category)"
            >
              <span class="size-2 rounded-full" [style.background]="color(category)"></span>
              {{ t(categoryKey(category)) }}
            </button>
          }
        </div>
      }

      <!-- results -->
      @if (!filtered().length) {
        <p class="px-4 py-16 text-center text-sm font-medium text-[var(--ink-faint)]">
          {{ t('tx.empty') }}
        </p>
      } @else {
        <div class="px-2 pb-2 sm:px-3">
          @for (group of visibleGroups(); track group.key) {
            <div class="pt-4">
              <div class="mb-1 flex items-baseline justify-between px-2.5 sm:px-3">
                <h4 class="text-[11px] font-extrabold uppercase tracking-widest text-[var(--ink-faint)]">
                  {{ group.heading }}
                </h4>
                <span class="tabular-nums text-[11px] font-bold text-[var(--ink-faint)]">
                  {{ fmt.money(group.total, 'EUR', { signed: true, decimals: false }) }}
                </span>
              </div>
              @for (tx of group.items; track tx.id) {
                <app-transaction-row [tx]="tx" [showBalance]="showBalance()" [showTime]="false" />
              }
            </div>
          }
        </div>

        <div
          class="flex items-center justify-between gap-3 border-t px-4 py-3"
          style="border-color: var(--hairline)"
        >
          <p class="text-xs font-semibold text-[var(--ink-faint)]">
            {{ shown() }} / {{ filtered().length }} {{ t('tx.results') }}
          </p>
          @if (shown() < filtered().length) {
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-xs font-bold text-white gradient-brand transition hover:shadow-[var(--shadow-glow)]"
              (click)="limit.set(limit() + PAGE_SIZE)"
            >
              {{ t('tx.loadMore') }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class TransactionList {
  readonly transactions = input.required<Transaction[]>();
  readonly showBalance = input(false);

  private readonly toasts = inject(ToastService);
  protected readonly fmt = inject(FormatService);
  protected readonly t = inject(I18nService).t;

  protected readonly PAGE_SIZE = PAGE_SIZE;
  protected readonly query = signal('');
  protected readonly direction = signal<Direction>('all');
  protected readonly selected = signal<ReadonlySet<TransactionCategory>>(new Set());
  protected readonly limit = signal(PAGE_SIZE);

  protected readonly directions = [
    { value: 'all' as const, key: 'tx.all' as const },
    { value: 'in' as const, key: 'tx.incoming' as const },
    { value: 'out' as const, key: 'tx.outgoing' as const },
  ];

  protected readonly color = (category: TransactionCategory) => CATEGORY_META[category].color;
  protected readonly categoryKey = (category: TransactionCategory) => `cat.${category}` as const;

  protected readonly categories = computed(() => {
    const present = new Set(this.transactions().map((t) => t.category));
    return [...present].sort();
  });

  protected readonly filtered = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const direction = this.direction();
    const categories = this.selected();

    return this.transactions().filter((tx) => {
      if (direction === 'in' && tx.amount <= 0) return false;
      if (direction === 'out' && tx.amount >= 0) return false;
      if (categories.size && !categories.has(tx.category)) return false;
      if (!needle) return true;
      return (
        tx.merchant.toLowerCase().includes(needle) ||
        tx.description.toLowerCase().includes(needle) ||
        tx.reference.toLowerCase().includes(needle)
      );
    });
  });

  protected readonly shown = computed(() => Math.min(this.limit(), this.filtered().length));

  protected readonly visibleGroups = computed<DayGroup[]>(() => {
    const slice = this.filtered().slice(0, this.limit());
    const groups = new Map<string, Transaction[]>();

    for (const tx of slice) {
      const key = tx.date.slice(0, 10);
      const bucket = groups.get(key) ?? [];
      bucket.push(tx);
      groups.set(key, bucket);
    }

    return [...groups.entries()].map(([key, items]) => ({
      key,
      heading: this.fmt.dayHeading(items[0].date),
      total: items.reduce((sum, tx) => sum + tx.amount, 0),
      items,
    }));
  });

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.limit.set(PAGE_SIZE);
  }

  protected setDirection(direction: Direction): void {
    this.direction.set(direction);
    this.limit.set(PAGE_SIZE);
  }

  protected toggleCategory(category: TransactionCategory): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(category)) next.add(category);
      return next;
    });
    this.limit.set(PAGE_SIZE);
  }

  /** Exports exactly what is on screen, respecting the active filters. */
  protected exportCsv(): void {
    const rows = this.filtered();
    const header = ['Date', 'Merchant', 'Description', 'Category', 'Amount', 'Currency', 'Reference'];
    const body = rows.map((tx) =>
      [
        tx.date.slice(0, 10),
        tx.merchant,
        tx.description,
        tx.category,
        tx.amount.toFixed(2),
        tx.currency,
        tx.reference,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    );

    const blob = new Blob([[header.join(','), ...body].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `millenia-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.toasts.success(`${rows.length} ${this.t('tx.results')} → CSV`);
  }
}
