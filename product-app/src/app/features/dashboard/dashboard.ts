import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import { AuthService } from '../../core/services/auth.service';
import { BankingStore } from '../../core/services/banking-store';
import { AreaChart } from '../../shared/charts/area-chart';
import { BarChart, type BarGroup } from '../../shared/charts/bar-chart';
import { DonutChart, type DonutSlice } from '../../shared/charts/donut-chart';
import { AccountTile } from '../../shared/ui/account-tile';
import { Icon } from '../../shared/ui/icon';
import { TransactionRow } from '../../shared/ui/transaction-row';
import { CATEGORY_META } from '../../shared/util/categories';
import { FormatService } from '../../shared/util/format.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AreaChart, BarChart, DonutChart, AccountTile, TransactionRow, Icon],
  template: `
    @if (store.loading()) {
      <div class="grid gap-4 lg:grid-cols-3">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="skeleton h-40 rounded-2xl" [class.lg:col-span-2]="i === 1"></div>
        }
      </div>
    } @else if (store.error()) {
      <div class="card mx-auto max-w-md p-8 text-center">
        <p class="font-semibold">{{ t('common.error') }}</p>
        <button
          class="mt-4 rounded-xl px-4 py-2 text-sm font-bold text-white gradient-brand"
          (click)="store.reload()"
        >
          {{ t('common.retry') }}
        </button>
      </div>
    } @else {
      <div class="mx-auto grid max-w-[1500px] gap-4 xl:grid-cols-3">
        <!-- ------------------------------------------------ hero balance -->
        <section
          class="aurora relative overflow-hidden rounded-[var(--radius-xl2)] p-6 text-white xl:col-span-2 animate-[rise_0.5s_var(--ease-spring)_both]"
          style="background: linear-gradient(135deg, #241f5c 0%, #4c2fcc 42%, #8b1fa8 100%)"
        >
          <div class="relative z-10">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                  {{ t('dash.welcome') }}, {{ auth.displayName().split(' ')[0] }}
                </p>
                <p class="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
                  {{ t('dash.netWorth') }}
                </p>
                <p class="mt-1 text-[2.6rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-5xl">
                  {{ fmt.money(store.netWorth(), 'EUR') }}
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span class="rounded-lg bg-white/15 px-2.5 py-1 backdrop-blur">
                    {{ t('dash.assets') }} {{ fmt.compact(store.assets()) }}
                  </span>
                  <span class="rounded-lg bg-white/15 px-2.5 py-1 backdrop-blur">
                    {{ t('dash.liabilities') }} {{ fmt.compact(store.liabilities()) }}
                  </span>
                </div>
              </div>

              <div class="flex gap-2">
                <a
                  routerLink="/transfers"
                  class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#2e1f6b] transition hover:scale-[1.03] active:scale-95"
                >
                  <app-icon name="transfer" [size]="17" [strokeWidth]="2.1" />
                  {{ t('dash.sendMoney') }}
                </a>
                <a
                  routerLink="/cards"
                  class="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/25"
                >
                  <app-icon name="snowflake" [size]="17" [strokeWidth]="2.1" />
                  <span class="hidden sm:inline">{{ t('dash.freezeCard') }}</span>
                </a>
              </div>
            </div>

            <div class="mt-4 -mb-2 text-white/90">
              <app-area-chart
                [values]="store.netWorthTrend()"
                [labels]="monthLabels()"
                color="#ffffff"
                colorEnd="#e9d5ff"
                [formatter]="compactEur"
                [ariaLabel]="t('dash.netWorth')"
              />
            </div>
          </div>
        </section>

        <!-- --------------------------------------------------- stat cards -->
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div class="card p-5 animate-[rise_0.5s_var(--ease-spring)_both] [animation-delay:80ms]">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-widest text-[var(--ink-faint)]">
                {{ t('dash.spentThisMonth') }}
              </p>
              <span
                class="grid size-9 place-items-center rounded-xl"
                style="background: color-mix(in oklab, var(--color-rose) 14%, transparent); color: var(--color-rose)"
              >
                <app-icon name="arrowUpRight" [size]="17" [strokeWidth]="2.2" />
              </span>
            </div>
            <p class="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">
              {{ fmt.money(store.monthSpend(), 'EUR', { decimals: false }) }}
            </p>
            <p class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
              <span
                class="rounded-md px-1.5 py-0.5 tabular-nums"
                [style.background]="deltaTint()"
                [style.color]="deltaColor()"
              >
                {{ store.spendDelta() > 0 ? '+' : '' }}{{ fmt.percent(store.spendDelta(), 0) }}
              </span>
              <span class="text-[var(--ink-faint)]">{{ t('dash.vsLastMonth') }}</span>
            </p>
          </div>

          <div class="card p-5 animate-[rise_0.5s_var(--ease-spring)_both] [animation-delay:140ms]">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-widest text-[var(--ink-faint)]">
                {{ t('dash.incomeThisMonth') }}
              </p>
              <span
                class="grid size-9 place-items-center rounded-xl"
                style="background: color-mix(in oklab, var(--color-mint) 16%, transparent); color: var(--color-mint)"
              >
                <app-icon name="arrowDownLeft" [size]="17" [strokeWidth]="2.2" />
              </span>
            </div>
            <p class="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">
              {{ fmt.money(store.monthIncome(), 'EUR', { decimals: false }) }}
            </p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full" style="background: var(--surface-sunken)">
              <span
                class="block h-full rounded-full transition-[width] duration-1000"
                [style.width.%]="savingRate() * 100"
                style="background: linear-gradient(90deg, #10b981, #22d3ee)"
              ></span>
            </div>
            <p class="mt-1.5 text-xs font-semibold text-[var(--ink-faint)]">
              {{ fmt.percent(savingRate(), 0) }} {{ t('dash.kept') }}
            </p>
          </div>
        </div>

        <!-- ----------------------------------------------------- cashflow -->
        <section class="card p-5 xl:col-span-2 animate-[rise_0.5s_var(--ease-spring)_both] [animation-delay:200ms]">
          <header class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-extrabold tracking-tight">{{ t('dash.cashflow') }}</h2>
              <p class="text-xs font-medium text-[var(--ink-faint)]">{{ t('dash.cashflowSub') }}</p>
            </div>
            <div class="flex items-center gap-3 text-xs font-bold">
              <span class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-full" style="background: #10b981"></span>
                {{ t('dash.income') }}
              </span>
              <span class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-full" style="background: #6b5bf5"></span>
                {{ t('dash.spend') }}
              </span>
            </div>
          </header>

          <app-bar-chart
            [groups]="cashflow()"
            [primaryLabel]="t('dash.income')"
            [secondaryLabel]="t('dash.spend')"
            [formatter]="compactEur"
            [ariaLabel]="t('dash.cashflow')"
          />
        </section>

        <!-- ---------------------------------------------------- breakdown -->
        <section class="card p-5 animate-[rise_0.5s_var(--ease-spring)_both] [animation-delay:260ms]">
          <header class="mb-4">
            <h2 class="text-base font-extrabold tracking-tight">{{ t('dash.breakdown') }}</h2>
            <p class="text-xs font-medium text-[var(--ink-faint)]">{{ t('dash.breakdownSub') }}</p>
          </header>

          @if (categorySlices().length) {
            <app-donut-chart
              [slices]="categorySlices()"
              [centreLabel]="t('dash.spentThisMonth')"
              [formatter]="compactEur"
              [ariaLabel]="t('dash.breakdown')"
            />
          } @else {
            <p class="py-10 text-center text-sm font-medium text-[var(--ink-faint)]">
              {{ t('dash.noSpend') }}
            </p>
          }
        </section>

        <!-- ----------------------------------------------------- accounts -->
        <section class="xl:col-span-2 animate-[rise_0.5s_var(--ease-spring)_both] [animation-delay:320ms]">
          <header class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-extrabold tracking-tight">{{ t('dash.yourAccounts') }}</h2>
            <a
              routerLink="/accounts"
              class="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-500)] hover:underline"
            >
              {{ t('dash.viewAll') }}
              <app-icon name="chevronRight" [size]="14" [strokeWidth]="2.4" />
            </a>
          </header>
          <div class="grid gap-3 sm:grid-cols-2">
            @for (account of topAccounts(); track account.id) {
              <app-account-tile [account]="account" />
            }
          </div>
        </section>

        <!-- ------------------------------------------------------- recent -->
        <section class="card p-4 animate-[rise_0.5s_var(--ease-spring)_both] [animation-delay:380ms]">
          <header class="mb-2 flex items-center justify-between px-1">
            <h2 class="text-base font-extrabold tracking-tight">{{ t('dash.recent') }}</h2>
            <a
              routerLink="/transactions"
              class="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-500)] hover:underline"
            >
              {{ t('dash.viewAll') }}
              <app-icon name="chevronRight" [size]="14" [strokeWidth]="2.4" />
            </a>
          </header>
          <div class="divide-y" style="border-color: var(--hairline)">
            @for (tx of recent(); track tx.id) {
              <app-transaction-row [tx]="tx" />
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class Dashboard {
  protected readonly store = inject(BankingStore);
  protected readonly auth = inject(AuthService);
  protected readonly fmt = inject(FormatService);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  protected readonly compactEur = (n: number) => this.fmt.compact(n, 'EUR');

  protected readonly monthLabels = computed(() => this.store.monthlyFlow().map((f) => f.label));

  protected readonly cashflow = computed<BarGroup[]>(() =>
    this.store.monthlyFlow().map((f) => ({
      key: f.month,
      label: f.label,
      primary: f.income,
      secondary: f.spend,
    })),
  );

  protected readonly categorySlices = computed<DonutSlice[]>(() =>
    this.store
      .spendByCategory()
      .slice(0, 6)
      .map((slice) => ({
        key: slice.category,
        label: this.t(`cat.${slice.category}` as const),
        value: slice.total,
        color: CATEGORY_META[slice.category].color,
      })),
  );

  protected readonly topAccounts = computed(() => this.store.accounts().slice(0, 4));

  protected readonly recent = computed(() => this.store.transactions().slice(0, 7));

  /** Share of this month's income that was not spent. */
  protected readonly savingRate = computed(() => {
    const income = this.store.monthIncome();
    if (!income) return 0;
    return Math.max(0, Math.min(1, (income - this.store.monthSpend()) / income));
  });

  protected readonly deltaColor = computed(() =>
    this.store.spendDelta() > 0 ? 'var(--color-rose)' : 'var(--color-mint)',
  );

  protected readonly deltaTint = computed(() =>
    this.store.spendDelta() > 0
      ? 'color-mix(in oklab, var(--color-rose) 15%, transparent)'
      : 'color-mix(in oklab, var(--color-mint) 16%, transparent)',
  );
}
