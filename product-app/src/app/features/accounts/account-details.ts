import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import { BankingStore } from '../../core/services/banking-store';
import { ToastService } from '../../core/services/toast.service';
import { AreaChart } from '../../shared/charts/area-chart';
import { Icon } from '../../shared/ui/icon';
import { TransactionList } from '../../shared/ui/transaction-list';
import { PRODUCT_META } from '../../shared/util/categories';
import { FormatService } from '../../shared/util/format.service';

@Component({
  selector: 'app-account-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, TransactionList, AreaChart],
  template: `
    <div class="mx-auto max-w-5xl">
      <a
        routerLink="/accounts"
        class="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-faint)] transition hover:text-[var(--ink)]"
      >
        <app-icon name="chevronLeft" [size]="15" [strokeWidth]="2.3" />
        {{ t('accounts.back') }}
      </a>

      @if (store.loading()) {
        <div class="skeleton mb-4 h-56 rounded-[var(--radius-xl2)]"></div>
        <div class="skeleton h-96 rounded-2xl"></div>
      } @else if (!account()) {
        <div class="card p-12 text-center">
          <p class="font-semibold">{{ t('accounts.notFound') }}</p>
        </div>
      } @else {
        <!-- ------------------------------------------------------- hero -->
        <section
          class="aurora relative mb-4 overflow-hidden rounded-[var(--radius-xl2)] p-6 text-white animate-[rise_0.45s_var(--ease-spring)_both]"
          [style.background]="meta().gradient"
        >
          <div class="relative z-10">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  @if (renaming()) {
                    <input
                      #nameInput
                      class="w-52 rounded-lg border-0 bg-white/20 px-2.5 py-1 text-lg font-extrabold text-white outline-none backdrop-blur placeholder:text-white/60"
                      [value]="account()!.nickname ?? ''"
                      (keydown.enter)="commitRename(nameInput.value)"
                      (keydown.escape)="renaming.set(false)"
                      autofocus
                    />
                    <button
                      type="button"
                      class="grid size-8 place-items-center rounded-lg bg-white/20 backdrop-blur transition hover:bg-white/30"
                      (click)="commitRename(nameInput.value)"
                      [attr.aria-label]="t('common.save')"
                    >
                      <app-icon name="check" [size]="16" [strokeWidth]="2.4" />
                    </button>
                  } @else {
                    <h2 class="truncate text-2xl font-extrabold tracking-tight">
                      {{ account()!.nickname ?? t(kindKey()) }}
                    </h2>
                    <button
                      type="button"
                      class="grid size-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/20 hover:text-white"
                      (click)="renaming.set(true)"
                      [attr.aria-label]="t('accounts.rename')"
                    >
                      <app-icon name="pencil" [size]="15" />
                    </button>
                  }
                </div>

                <button
                  type="button"
                  class="mt-1.5 inline-flex items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1 font-mono text-xs font-semibold backdrop-blur transition hover:bg-white/25"
                  (click)="copyIban()"
                  [attr.aria-label]="t('accounts.copy')"
                >
                  {{ fmt.iban(account()!.iban) }}
                  <app-icon name="copy" [size]="14" />
                </button>
              </div>

              <span
                class="rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest backdrop-blur"
              >
                {{ t(kindKey()) }}
              </span>
            </div>

            <p class="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
              {{ t('accounts.total') }}
            </p>
            <p class="mt-0.5 text-[2.5rem] leading-none font-extrabold tracking-tight tabular-nums">
              {{ fmt.money(account()!.balance, account()!.currency) }}
            </p>

            <dl class="mt-5 flex flex-wrap gap-2.5">
              @for (stat of stats(); track stat.label) {
                <div class="rounded-xl bg-white/15 px-3.5 py-2 backdrop-blur">
                  <dt class="text-[10px] font-bold uppercase tracking-widest opacity-70">
                    {{ stat.label }}
                  </dt>
                  <dd class="tabular-nums text-sm font-extrabold">{{ stat.value }}</dd>
                </div>
              }
            </dl>

            @if (balanceTrend().length > 1) {
              <div class="mt-3 -mb-2 text-white/90">
                <app-area-chart
                  [values]="balanceTrend()"
                  color="#ffffff"
                  colorEnd="#ffffff"
                  [formatter]="money"
                  [ariaLabel]="t('accounts.total')"
                />
              </div>
            }
          </div>
        </section>

        <!-- ------------------------------------------------ linked cards -->
        @if (cards().length) {
          <section class="mb-4">
            <h3 class="mb-2.5 text-sm font-extrabold tracking-tight">{{ t('accounts.linkedCards') }}</h3>
            <div class="flex flex-wrap gap-3">
              @for (card of cards(); track card.id) {
                <a
                  routerLink="/cards"
                  class="flex items-center gap-3 rounded-2xl border px-4 py-3 transition hover:shadow-[var(--shadow-card)]"
                  style="border-color: var(--hairline); background: var(--surface-raised)"
                >
                  <span
                    class="grid size-10 place-items-center rounded-xl text-white"
                    [style.background]="card.frozen ? 'var(--ink-faint)' : meta().gradient"
                  >
                    <app-icon [name]="card.frozen ? 'snowflake' : 'card'" [size]="18" />
                  </span>
                  <div>
                    <p class="font-mono text-xs font-bold">{{ fmt.maskCard(card.number) }}</p>
                    <p class="text-[11px] font-semibold text-[var(--ink-faint)]">
                      {{ card.frozen ? t('cards.frozen') : t('cards.active') }} ·
                      {{ card.kind === 'virtual' ? t('cards.virtual') : t('cards.physical') }}
                    </p>
                  </div>
                </a>
              }
            </div>
          </section>
        }

        <app-transaction-list [transactions]="transactions()" [showBalance]="true" />
      }
    </div>
  `,
})
export class AccountDetails {
  /** Bound from the `:id` route param via `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  protected readonly store = inject(BankingStore);
  protected readonly fmt = inject(FormatService);
  private readonly toasts = inject(ToastService);
  protected readonly t = inject(I18nService).t;

  protected readonly renaming = signal(false);

  protected readonly account = computed(
    () => this.store.accounts().find((a) => a.id === this.id()) ?? null,
  );

  protected readonly transactions = computed(() =>
    this.store.transactions().filter((tx) => tx.accountId === this.id()),
  );

  protected readonly cards = computed(() =>
    this.store.cards().filter((card) => card.accountId === this.id()),
  );

  protected readonly meta = computed(() => PRODUCT_META[this.account()?.kind ?? 'current']);
  protected readonly kindKey = computed(() => `kind.${this.account()?.kind ?? 'current'}` as const);

  protected readonly money = (n: number) =>
    this.fmt.money(n, this.account()?.currency ?? 'EUR', { decimals: false });

  /** Last 30 booked balances, oldest → newest, for the hero sparkline. */
  protected readonly balanceTrend = computed(() =>
    this.transactions()
      .filter((tx) => tx.balanceAfter !== null)
      .slice(0, 30)
      .map((tx) => tx.balanceAfter!)
      .reverse(),
  );

  protected readonly stats = computed(() => {
    const account = this.account();
    if (!account) return [];
    const rows: { label: string; value: string }[] = [
      { label: this.t('accounts.available'), value: this.fmt.money(account.available, account.currency) },
    ];

    if (account.kind === 'loan') {
      if (account.principal) {
        rows.push({
          label: this.t('accounts.principal'),
          value: this.fmt.money(account.principal, account.currency, { decimals: false }),
        });
        rows.push({
          label: this.t('accounts.repaid'),
          value: this.fmt.percent(1 - Math.abs(account.balance) / account.principal, 0),
        });
      }
      if (account.instalment) {
        rows.push({
          label: this.t('accounts.instalment'),
          value: this.fmt.money(account.instalment, account.currency),
        });
      }
    }

    if (account.kind === 'credit-card' && account.creditLimit) {
      rows.push({
        label: this.t('accounts.creditLimit'),
        value: this.fmt.money(account.creditLimit, account.currency, { decimals: false }),
      });
    }

    if (account.interestRate) {
      rows.push({ label: this.t('accounts.rate'), value: this.fmt.percent(account.interestRate, 2) });
    }

    return rows;
  });

  protected commitRename(value: string): void {
    this.store.renameAccount(this.id(), value);
    this.renaming.set(false);
    this.toasts.success(this.t('accounts.renamed'));
  }

  protected async copyIban(): Promise<void> {
    const account = this.account();
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.iban.replace(/\s/g, ''));
      this.toasts.success(this.t('accounts.copied'));
    } catch {
      this.toasts.error(this.t('common.error'));
    }
  }
}
