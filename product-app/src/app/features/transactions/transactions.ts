import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import { BankingStore } from '../../core/services/banking-store';
import { Icon } from '../../shared/ui/icon';
import { TransactionList } from '../../shared/ui/transaction-list';
import { FormatService } from '../../shared/util/format.service';

/** All transactions across products, with an account selector on top. */
@Component({
  selector: 'app-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TransactionList, Icon],
  template: `
    <div class="mx-auto max-w-5xl">
      <header class="mb-5">
        <h2 class="text-2xl font-extrabold tracking-tight">{{ t('tx.title') }}</h2>
        <p class="mt-1 text-sm font-medium text-[var(--ink-faint)]">
          {{ store.transactions().length }} {{ t('tx.results') }}
        </p>
      </header>

      <div class="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          class="shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition"
          [style.border-color]="accountId() === null ? 'var(--color-brand-500)' : 'var(--hairline)'"
          [style.background]="accountId() === null ? 'var(--color-brand-500)' : 'var(--surface-raised)'"
          [style.color]="accountId() === null ? '#fff' : 'var(--ink-soft)'"
          (click)="accountId.set(null)"
        >
          {{ t('tx.all') }}
        </button>
        @for (account of store.accounts(); track account.id) {
          <button
            type="button"
            class="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition"
            [style.border-color]="accountId() === account.id ? 'var(--color-brand-500)' : 'var(--hairline)'"
            [style.background]="accountId() === account.id ? 'var(--color-brand-500)' : 'var(--surface-raised)'"
            [style.color]="accountId() === account.id ? '#fff' : 'var(--ink-soft)'"
            (click)="accountId.set(account.id)"
          >
            <app-icon name="wallet" [size]="15" />
            {{ account.nickname ?? account.title }}
          </button>
        }
      </div>

      @if (store.loading()) {
        <div class="skeleton h-96 rounded-2xl"></div>
      } @else {
        <app-transaction-list [transactions]="visible()" [showBalance]="accountId() !== null" />
      }
    </div>
  `,
})
export class Transactions {
  protected readonly store = inject(BankingStore);
  protected readonly fmt = inject(FormatService);
  protected readonly t = inject(I18nService).t;

  protected readonly accountId = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const id = this.accountId();
    const all = this.store.transactions();
    return id ? all.filter((tx) => tx.accountId === id) : all;
  });
}
