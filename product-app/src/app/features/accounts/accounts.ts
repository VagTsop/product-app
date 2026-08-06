import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Account, ProductKind } from '../../core/models/banking.models';
import { BankingStore, toEur } from '../../core/services/banking-store';
import { AccountTile } from '../../shared/ui/account-tile';
import { Icon } from '../../shared/ui/icon';
import { PRODUCT_META } from '../../shared/util/categories';
import { FormatService } from '../../shared/util/format.service';

interface AccountGroup {
  readonly kind: ProductKind;
  readonly accounts: Account[];
  readonly total: number;
}

const GROUP_ORDER: ProductKind[] = ['current', 'savings', 'credit-card', 'loan'];

@Component({
  selector: 'app-accounts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountTile, Icon],
  template: `
    <div class="mx-auto max-w-[1500px]">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight">{{ t('accounts.title') }}</h2>
          <p class="mt-1 text-sm font-medium text-[var(--ink-faint)]">{{ t('accounts.subtitle') }}</p>
        </div>
        <div
          class="rounded-2xl border px-5 py-3"
          style="border-color: var(--hairline); background: var(--surface-raised)"
        >
          <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
            {{ t('accounts.total') }}
          </p>
          <p class="tabular-nums text-2xl font-extrabold tracking-tight">
            {{ fmt.money(store.netWorth(), 'EUR') }}
          </p>
        </div>
      </header>

      @if (store.loading()) {
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="skeleton h-36 rounded-2xl"></div>
          }
        </div>
      } @else if (!groups().length) {
        <p class="card p-10 text-center text-sm font-medium text-[var(--ink-faint)]">
          {{ t('accounts.empty') }}
        </p>
      } @else {
        <div class="space-y-8">
          @for (group of groups(); track group.kind; let g = $index) {
            <section class="animate-[rise_0.5s_var(--ease-spring)_both]" [style.animation-delay.ms]="g * 90">
              <header class="mb-3 flex items-center gap-3">
                <span
                  class="grid size-9 place-items-center rounded-xl text-white"
                  [style.background]="meta(group.kind).gradient"
                >
                  <app-icon [name]="meta(group.kind).icon" [size]="18" />
                </span>
                <h3 class="text-sm font-extrabold tracking-tight">
                  {{ t(kindKey(group.kind)) }}
                </h3>
                <span
                  class="rounded-md px-2 py-0.5 text-[11px] font-bold text-[var(--ink-faint)]"
                  style="background: var(--surface-sunken)"
                >
                  {{ group.accounts.length }}
                </span>
                <span class="ml-auto tabular-nums text-sm font-extrabold">
                  {{ fmt.money(group.total, 'EUR') }}
                </span>
              </header>

              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                @for (account of group.accounts; track account.id) {
                  <app-account-tile [account]="account" />
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
})
export class Accounts {
  protected readonly store = inject(BankingStore);
  protected readonly fmt = inject(FormatService);
  protected readonly t = inject(I18nService).t;

  protected readonly meta = (kind: ProductKind) => PRODUCT_META[kind];
  protected readonly kindKey = (kind: ProductKind) => `kind.${kind}` as const;

  protected readonly groups = computed<AccountGroup[]>(() => {
    const byKind = new Map<ProductKind, Account[]>();
    for (const account of this.store.accounts()) {
      const bucket = byKind.get(account.kind) ?? [];
      bucket.push(account);
      byKind.set(account.kind, bucket);
    }

    return GROUP_ORDER.filter((kind) => byKind.has(kind)).map((kind) => {
      const accounts = byKind.get(kind)!;
      return {
        kind,
        accounts,
        total: accounts.reduce((sum, a) => sum + toEur(a.balance, a.currency), 0),
      };
    });
  });
}
