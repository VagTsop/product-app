import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Transaction } from '../../core/models/banking.models';
import { CATEGORY_META } from '../util/categories';
import { FormatService } from '../util/format.service';
import { Icon } from './icon';

@Component({
  selector: 'app-transaction-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div
      class="group flex items-center gap-3.5 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[var(--surface-sunken)] sm:px-3"
    >
      <span
        class="grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
        [style.background]="tint()"
        [style.color]="meta().color"
      >
        <app-icon [name]="meta().icon" [size]="18" [strokeWidth]="1.9" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <p class="truncate text-sm font-bold">{{ tx().merchant }}</p>
          @if (tx().status === 'pending') {
            <span
              class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style="background: color-mix(in oklab, var(--color-amber) 18%, transparent); color: var(--color-amber)"
            >
              {{ t('tx.pending') }}
            </span>
          }
        </div>
        <p class="truncate text-xs font-medium text-[var(--ink-faint)]">
          {{ tx().description }}
          @if (showTime()) {
            · {{ fmt.date(tx().date) }}, {{ fmt.date(tx().date, 'time') }}
          }
        </p>
      </div>

      <div class="shrink-0 text-right">
        <p
          class="tabular-nums text-sm font-extrabold"
          [style.color]="tx().amount > 0 ? 'var(--color-mint)' : 'var(--ink)'"
        >
          {{ fmt.money(tx().amount, tx().currency, { signed: true }) }}
        </p>
        @if (tx().balanceAfter !== null && showBalance()) {
          <p class="tabular-nums text-[11px] font-semibold text-[var(--ink-faint)]">
            {{ fmt.money(tx().balanceAfter!, tx().currency) }}
          </p>
        }
      </div>
    </div>
  `,
})
export class TransactionRow {
  readonly tx = input.required<Transaction>();
  readonly showBalance = input(false);
  readonly showTime = input(true);

  protected readonly fmt = inject(FormatService);
  protected readonly t = inject(I18nService).t;

  protected readonly meta = computed(() => CATEGORY_META[this.tx().category]);
  protected readonly tint = computed(
    () => `color-mix(in oklab, ${this.meta().color} 15%, transparent)`,
  );
}
