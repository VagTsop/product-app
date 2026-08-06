import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Account } from '../../core/models/banking.models';
import { PRODUCT_META } from '../util/categories';
import { FormatService } from '../util/format.service';
import { Icon } from './icon';

/** Account summary tile with a gradient product badge and a hover lift. */
@Component({
  selector: 'app-account-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/accounts', account().id]"
      class="tile group relative block overflow-hidden rounded-2xl border p-4 transition-all duration-300"
      style="border-color: var(--hairline); background: var(--surface-raised)"
    >
      <span
        class="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
        [style.background]="meta().accent"
      ></span>

      <div class="relative flex items-start gap-3">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-xl text-white shadow-[var(--shadow-card)]"
          [style.background]="meta().gradient"
        >
          <app-icon [name]="meta().icon" [size]="20" />
        </span>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-extrabold">
            {{ account().nickname ?? t(kindKey()) }}
          </p>
          <p class="truncate font-mono text-[11px] font-medium text-[var(--ink-faint)]">
            {{ fmt.maskIban(account().iban) }}
          </p>
        </div>

        <span
          class="mt-1 shrink-0 text-[var(--ink-faint)] transition-transform duration-300 group-hover:translate-x-1"
        >
          <app-icon name="chevronRight" [size]="18" />
        </span>
      </div>

      <div class="relative mt-4 flex items-end justify-between gap-3">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
            {{ t(kindKey()) }}
          </p>
          <p class="tabular-nums text-xl font-extrabold tracking-tight">
            {{ fmt.money(account().balance, account().currency) }}
          </p>
        </div>

        @if (utilisation() !== null) {
          <div class="w-24">
            <div class="mb-1 flex justify-between text-[10px] font-bold text-[var(--ink-faint)]">
              <span>{{ (utilisation()! * 100).toFixed(0) }}%</span>
              <span>{{ t(utilisationKey()) }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full" style="background: var(--surface-sunken)">
              <span
                class="block h-full rounded-full transition-[width] duration-700"
                [style.width.%]="utilisation()! * 100"
                [style.background]="meta().gradient"
              ></span>
            </div>
          </div>
        } @else {
          <p class="text-right text-[11px] font-semibold text-[var(--ink-faint)]">
            {{ t('accounts.available') }}<br />
            <span class="tabular-nums text-[var(--ink-soft)]">
              {{ fmt.money(account().available, account().currency, { decimals: false }) }}
            </span>
          </p>
        }
      </div>
    </a>
  `,
  styles: `
    .tile:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lift);
      border-color: color-mix(in oklab, var(--color-brand-500) 35%, var(--hairline));
    }
  `,
})
export class AccountTile {
  readonly account = input.required<Account>();

  protected readonly fmt = inject(FormatService);
  protected readonly t = inject(I18nService).t;

  protected readonly meta = computed(() => PRODUCT_META[this.account().kind]);
  protected readonly kindKey = computed(() => `kind.${this.account().kind}` as const);

  /** Credit cards show limit usage; loans show repayment progress. */
  protected readonly utilisation = computed<number | null>(() => {
    const a = this.account();
    if (a.kind === 'credit-card' && a.creditLimit) {
      return Math.min(1, Math.abs(a.balance) / a.creditLimit);
    }
    if (a.kind === 'loan' && a.principal) {
      return Math.min(1, 1 - Math.abs(a.balance) / a.principal);
    }
    return null;
  });

  /** Loans measure progress ("repaid"); credit cards measure usage ("used"). */
  protected readonly utilisationKey = computed(() =>
    this.account().kind === 'loan' ? ('accounts.repaid' as const) : ('accounts.used' as const),
  );
}
