import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Card } from '../../core/models/banking.models';
import { BankingStore } from '../../core/services/banking-store';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from '../../shared/ui/icon';
import { FormatService } from '../../shared/util/format.service';

const NETWORK_GRADIENT: Record<string, string> = {
  visa: 'linear-gradient(135deg, #241f5c 0%, #4c2fcc 45%, #8b1fa8 100%)',
  mastercard: 'linear-gradient(135deg, #7c2d12 0%, #c026d3 50%, #f43f5e 100%)',
};

@Component({
  selector: 'app-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="mx-auto max-w-[1200px]">
      <header class="mb-6">
        <h2 class="text-2xl font-extrabold tracking-tight">{{ t('cards.title') }}</h2>
        <p class="mt-1 text-sm font-medium text-[var(--ink-faint)]">{{ t('cards.subtitle') }}</p>
      </header>

      @if (store.loading()) {
        <div class="grid gap-6 lg:grid-cols-2">
          @for (i of [1, 2]; track i) {
            <div class="skeleton h-[420px] rounded-[var(--radius-xl2)]"></div>
          }
        </div>
      } @else {
        <div class="grid gap-6 lg:grid-cols-2">
          @for (card of store.cards(); track card.id; let i = $index) {
            <article
              class="card overflow-hidden p-5 animate-[rise_0.5s_var(--ease-spring)_both]"
              [style.animation-delay.ms]="i * 90"
            >
              <!-- ------------------------------------------- card visual -->
              <div class="perspective mb-5">
                <div
                  class="flip relative h-[210px] w-full max-w-[350px]"
                  [style.transform]="revealed() === card.id ? 'rotateY(180deg)' : null"
                >
                  <!-- front -->
                  <div
                    class="face absolute inset-0 flex flex-col justify-between rounded-2xl p-5 text-white shadow-[var(--shadow-lift)]"
                    [style.background]="gradient(card)"
                    [style.filter]="card.frozen ? 'grayscale(0.85) brightness(0.85)' : null"
                  >
                    <div class="flex items-start justify-between">
                      <span class="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
                        {{ t('app.name') }}
                      </span>
                      <span class="flex items-center gap-2">
                        @if (card.contactless) {
                          <app-icon name="wifi" [size]="17" />
                        }
                        <span class="text-[11px] font-bold uppercase tracking-wider opacity-80">
                          {{ card.kind === 'virtual' ? t('cards.virtual') : t('cards.physical') }}
                        </span>
                      </span>
                    </div>

                    <div>
                      <div class="mb-3 h-8 w-11 rounded-md bg-white/25"></div>
                      <p class="font-mono text-[16px] tracking-[0.14em]">
                        {{ fmt.maskCard(card.number) }}
                      </p>
                    </div>

                    <div class="flex items-end justify-between">
                      <div>
                        <p class="text-[9px] font-bold uppercase tracking-widest opacity-60">
                          {{ card.holder }}
                        </p>
                        <p class="text-[10px] font-bold tracking-wider opacity-85">
                          {{ t('cards.expires') }} {{ card.expiry }}
                        </p>
                      </div>
                      <span class="text-lg font-extrabold italic tracking-tight opacity-90">
                        {{ card.network === 'visa' ? 'VISA' : 'mc' }}
                      </span>
                    </div>

                    @if (card.frozen) {
                      <div
                        class="absolute inset-0 grid place-items-center rounded-2xl bg-black/35 backdrop-blur-[2px]"
                      >
                        <span
                          class="flex items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-extrabold uppercase tracking-widest text-[#1b2a4a]"
                        >
                          <app-icon name="snowflake" [size]="16" [strokeWidth]="2.2" />
                          {{ t('cards.frozen') }}
                        </span>
                      </div>
                    }
                  </div>

                  <!-- back -->
                  <div
                    class="face back absolute inset-0 flex flex-col rounded-2xl text-white shadow-[var(--shadow-lift)]"
                    [style.background]="gradient(card)"
                  >
                    <div class="mt-6 h-11 w-full bg-black/70"></div>
                    <div class="px-5 pt-4">
                      <p class="text-[9px] font-bold uppercase tracking-widest opacity-70">CVV</p>
                      <div
                        class="mt-1 flex h-9 items-center rounded-md bg-white px-3 font-mono text-sm font-bold tracking-widest text-[#1b2a4a]"
                      >
                        {{ card.cvv }}
                      </div>
                      <p class="mt-3 font-mono text-[13px] tracking-[0.12em]">{{ card.number }}</p>
                      <p class="mt-1 text-[10px] font-semibold opacity-75">
                        {{ t('cards.expires') }} {{ card.expiry }} · {{ card.holder }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ---------------------------------------------- controls -->
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition"
                  [style.background]="
                    card.frozen
                      ? 'color-mix(in oklab, var(--color-mint) 15%, transparent)'
                      : 'color-mix(in oklab, var(--color-cyan) 15%, transparent)'
                  "
                  [style.color]="card.frozen ? 'var(--color-mint)' : '#0891b2'"
                  (click)="toggleFreeze(card)"
                >
                  <app-icon [name]="card.frozen ? 'check' : 'snowflake'" [size]="15" [strokeWidth]="2.2" />
                  {{ card.frozen ? t('cards.unfreeze') : t('cards.freeze') }}
                </button>

                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold text-[var(--ink-soft)] transition hover:bg-[var(--surface-sunken)]"
                  style="border-color: var(--hairline)"
                  (click)="toggleReveal(card.id)"
                >
                  <app-icon [name]="revealed() === card.id ? 'eyeOff' : 'eye'" [size]="15" />
                  {{ revealed() === card.id ? t('cards.hide') : t('cards.reveal') }}
                </button>

                <span
                  class="ml-auto flex items-center gap-1.5 text-[11px] font-bold"
                  [style.color]="card.frozen ? 'var(--ink-faint)' : 'var(--color-mint)'"
                >
                  <span
                    class="size-2 rounded-full"
                    [style.background]="card.frozen ? 'var(--ink-faint)' : 'var(--color-mint)'"
                    [class.animate-pulse-ring]="!card.frozen"
                  ></span>
                  {{ card.frozen ? t('cards.frozen') : t('cards.active') }}
                </span>
              </div>

              <!-- spend vs limit -->
              <div class="mt-5">
                <div class="mb-1.5 flex items-baseline justify-between text-xs font-bold">
                  <span class="text-[var(--ink-faint)]">{{ t('cards.spent') }}</span>
                  <span class="tabular-nums">
                    {{ fmt.money(card.spentThisMonth, card.currency, { decimals: false }) }}
                    <span class="text-[var(--ink-faint)]">
                      / {{ fmt.money(card.monthlyLimit, card.currency, { decimals: false }) }}
                    </span>
                  </span>
                </div>
                <div class="h-2 overflow-hidden rounded-full" style="background: var(--surface-sunken)">
                  <span
                    class="block h-full rounded-full transition-[width] duration-700"
                    [style.width.%]="usage(card) * 100"
                    [style.background]="
                      usage(card) > 0.85
                        ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                        : 'linear-gradient(90deg, #6b5bf5, #c026d3)'
                    "
                  ></span>
                </div>

                <label class="mt-4 block">
                  <span class="text-xs font-bold text-[var(--ink-faint)]">{{ t('cards.limit') }}</span>
                  <div class="mt-1.5 flex items-center gap-3">
                    <input
                      type="range"
                      class="slider flex-1"
                      min="100"
                      max="10000"
                      step="100"
                      [value]="card.monthlyLimit"
                      (input)="onLimit(card, $event)"
                      (change)="confirmLimit()"
                    />
                    <span class="w-24 text-right tabular-nums text-sm font-extrabold">
                      {{ fmt.money(card.monthlyLimit, card.currency, { decimals: false }) }}
                    </span>
                  </div>
                </label>
              </div>

              <!-- switches -->
              <div class="mt-4 space-y-1">
                @for (toggle of toggles(card); track toggle.key) {
                  <div class="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-[var(--surface-sunken)]">
                    <span class="flex items-center gap-2.5 text-sm font-semibold">
                      <app-icon [name]="toggle.icon" [size]="17" />
                      {{ toggle.label }}
                    </span>
                    <button
                      type="button"
                      class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300"
                      [style.background]="toggle.value ? 'var(--color-brand-500)' : 'var(--hairline)'"
                      [attr.aria-pressed]="toggle.value"
                      [attr.aria-label]="toggle.label"
                      (click)="toggleSetting(card, toggle.key, !toggle.value)"
                    >
                      <span
                        class="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300"
                        [style.transform]="toggle.value ? 'translateX(20px)' : null"
                        style="transition-timing-function: var(--ease-spring)"
                      ></span>
                    </button>
                  </div>
                }
              </div>

              <p class="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-faint)]">
                <app-icon name="wallet" [size]="14" />
                {{ t('cards.linkedTo') }} {{ accountName(card.accountId) }}
              </p>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .perspective {
      perspective: 1400px;
    }
    .flip {
      transform-style: preserve-3d;
      transition: transform 0.7s var(--ease-spring);
    }
    .face {
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      overflow: hidden;
    }
    .back {
      transform: rotateY(180deg);
    }
    .slider {
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      border-radius: 99px;
      background: var(--surface-sunken);
      outline: none;
    }
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-brand-500);
      border: 3px solid var(--surface-raised);
      box-shadow: var(--shadow-card);
      cursor: pointer;
    }
    .slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border: 3px solid var(--surface-raised);
      border-radius: 50%;
      background: var(--color-brand-500);
      cursor: pointer;
    }
  `,
})
export class Cards {
  protected readonly store = inject(BankingStore);
  protected readonly fmt = inject(FormatService);
  private readonly toasts = inject(ToastService);
  protected readonly t = inject(I18nService).t;

  protected readonly revealed = signal<string | null>(null);

  private readonly accountNames = computed(
    () => new Map(this.store.accounts().map((a) => [a.id, a.nickname ?? a.title])),
  );

  protected accountName(id: string): string {
    return this.accountNames().get(id) ?? '—';
  }

  protected gradient(card: Card): string {
    return NETWORK_GRADIENT[card.network] ?? NETWORK_GRADIENT['visa'];
  }

  protected usage(card: Card): number {
    return Math.min(1, card.spentThisMonth / Math.max(1, card.monthlyLimit));
  }

  protected toggles(card: Card) {
    return [
      {
        key: 'contactless' as const,
        icon: 'wifi' as const,
        label: this.t('cards.contactless'),
        value: card.contactless,
      },
      {
        key: 'onlinePayments' as const,
        icon: 'shield' as const,
        label: this.t('cards.online'),
        value: card.onlinePayments,
      },
    ];
  }

  protected toggleReveal(id: string): void {
    this.revealed.update((current) => (current === id ? null : id));
  }

  protected toggleFreeze(card: Card): void {
    const frozen = this.store.toggleCardFreeze(card.id);
    this.toasts.show(
      frozen ? this.t('cards.frozenToast') : this.t('cards.unfrozenToast'),
      frozen ? 'warning' : 'success',
    );
  }

  protected toggleSetting(card: Card, key: 'contactless' | 'onlinePayments', value: boolean): void {
    this.store.updateCard(card.id, { [key]: value });
  }

  protected onLimit(card: Card, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.store.updateCard(card.id, { monthlyLimit: value });
  }

  protected confirmLimit(): void {
    this.toasts.success(this.t('cards.limitSaved'));
  }
}
