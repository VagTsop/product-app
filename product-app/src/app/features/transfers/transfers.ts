import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import type { Account, Payee } from '../../core/models/banking.models';
import { BankingStore } from '../../core/services/banking-store';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from '../../shared/ui/icon';
import { ibanValidator, isValidIban } from '../../shared/validators/iban.validator';
import { FormatService } from '../../shared/util/format.service';

type Step = 0 | 1 | 2 | 3;

/** Three-step transfer wizard with IBAN validation and a confirmation screen. */
@Component({
  selector: 'app-transfers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon],
  template: `
    <div class="mx-auto max-w-2xl">
      <header class="mb-6">
        <h2 class="text-2xl font-extrabold tracking-tight">{{ t('transfer.title') }}</h2>
        <p class="mt-1 text-sm font-medium text-[var(--ink-faint)]">{{ t('transfer.subtitle') }}</p>
      </header>

      <!-- ------------------------------------------------------ stepper -->
      @if (step() < 3) {
        <ol class="mb-6 flex items-center gap-2">
          @for (label of stepLabels; track label; let i = $index) {
            <li class="flex flex-1 items-center gap-2">
              <span
                class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-all duration-300"
                [style.background]="i <= step() ? 'var(--color-brand-500)' : 'var(--surface-sunken)'"
                [style.color]="i <= step() ? '#fff' : 'var(--ink-faint)'"
                [style.box-shadow]="i === step() ? 'var(--shadow-glow)' : 'none'"
              >
                @if (i < step()) {
                  <app-icon name="check" [size]="15" [strokeWidth]="2.6" />
                } @else {
                  {{ i + 1 }}
                }
              </span>
              <span
                class="hidden text-xs font-bold sm:block"
                [style.color]="i <= step() ? 'var(--ink)' : 'var(--ink-faint)'"
              >
                {{ t(label) }}
              </span>
              @if (i < 2) {
                <span
                  class="h-0.5 flex-1 rounded-full transition-colors duration-300"
                  [style.background]="i < step() ? 'var(--color-brand-500)' : 'var(--hairline)'"
                ></span>
              }
            </li>
          }
        </ol>
      }

      <form [formGroup]="form" (ngSubmit)="next()" novalidate>
        <!-- ================================================ step 1 -->
        @if (step() === 0) {
          <section class="card space-y-5 p-5 animate-[rise_0.4s_var(--ease-spring)_both]">
            <div>
              <label class="lbl" for="from">{{ t('transfer.from') }}</label>
              <div class="mt-2 grid gap-2 sm:grid-cols-2">
                @for (account of sourceAccounts(); track account.id) {
                  <button
                    type="button"
                    class="rounded-xl border p-3 text-left transition"
                    [style.border-color]="
                      selectedId() === account.id ? 'var(--color-brand-500)' : 'var(--hairline)'
                    "
                    [style.background]="
                      selectedId() === account.id
                        ? 'color-mix(in oklab, var(--color-brand-500) 8%, transparent)'
                        : 'var(--surface-raised)'
                    "
                    (click)="form.controls.fromAccountId.setValue(account.id)"
                  >
                    <p class="truncate text-sm font-extrabold">{{ account.nickname ?? account.title }}</p>
                    <p class="font-mono text-[11px] font-medium text-[var(--ink-faint)]">
                      {{ fmt.maskIban(account.iban) }}
                    </p>
                    <p class="mt-1.5 tabular-nums text-sm font-bold">
                      {{ fmt.money(account.available, account.currency) }}
                    </p>
                  </button>
                }
              </div>
            </div>

            <div>
              <label class="lbl">{{ t('transfer.payee') }}</label>
              <div class="no-scrollbar mt-2 flex gap-2.5 overflow-x-auto pb-1">
                @for (payee of payees(); track payee.id) {
                  <button
                    type="button"
                    class="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-xl border p-3 transition"
                    [style.border-color]="
                      selectedPayeeId() === payee.id ? 'var(--color-brand-500)' : 'var(--hairline)'
                    "
                    (click)="choosePayee(payee)"
                  >
                    <span
                      class="grid size-10 place-items-center rounded-full text-xs font-extrabold text-white gradient-brand"
                    >
                      {{ payee.initials }}
                    </span>
                    <span class="line-clamp-2 text-center text-[11px] font-bold leading-tight">
                      {{ payee.name }}
                    </span>
                  </button>
                }
              </div>
            </div>

            <div class="grid gap-4">
              <div>
                <label class="lbl" for="name">{{ t('transfer.name') }}</label>
                <input id="name" class="inp" formControlName="payeeName" autocomplete="off" />
                @if (invalid('payeeName')) {
                  <p class="err">{{ t('transfer.nameRequired') }}</p>
                }
              </div>

              <div>
                <label class="lbl" for="iban">{{ t('transfer.iban') }}</label>
                <div class="relative">
                  <input
                    id="iban"
                    class="inp pr-11 font-mono uppercase"
                    formControlName="iban"
                    autocomplete="off"
                    placeholder="GR16 0110 1250 0000 0001 2300 695"
                  />
                  @if (ibanOk()) {
                    <span
                      class="absolute top-1/2 right-3 -translate-y-1/2"
                      style="color: var(--color-mint)"
                      aria-hidden="true"
                    >
                      <app-icon name="check" [size]="18" [strokeWidth]="2.6" />
                    </span>
                  }
                </div>
                @if (invalid('iban')) {
                  <p class="err">{{ t('transfer.ibanInvalid') }}</p>
                }
              </div>
            </div>
          </section>
        }

        <!-- ================================================ step 2 -->
        @if (step() === 1) {
          <section class="card space-y-5 p-5 animate-[rise_0.4s_var(--ease-spring)_both]">
            <div>
              <label class="lbl" for="amount">{{ t('transfer.amount') }}</label>
              <div
                class="mt-1.5 flex h-16 items-center gap-2 rounded-xl border px-4 transition focus-within:border-[var(--color-brand-500)]"
                style="border-color: var(--hairline); background: var(--surface-sunken)"
              >
                <span class="text-2xl font-extrabold text-[var(--ink-faint)]">
                  {{ currencySymbol() }}
                </span>
                <input
                  id="amount"
                  type="number"
                  inputmode="decimal"
                  step="0.01"
                  min="0"
                  class="min-w-0 flex-1 border-0 bg-transparent text-3xl font-extrabold tabular-nums text-[var(--ink)] outline-none"
                  formControlName="amount"
                  placeholder="0.00"
                />
              </div>
              @if (form.controls.amount.hasError('overBalance') && form.controls.amount.touched) {
                <p class="err">{{ t('transfer.amountTooHigh') }}</p>
              } @else if (invalid('amount')) {
                <p class="err">{{ t('transfer.amountRequired') }}</p>
              }

              <div class="mt-3 flex flex-wrap gap-2">
                @for (preset of presets; track preset) {
                  <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-xs font-bold text-[var(--ink-soft)] transition hover:bg-[var(--surface-sunken)]"
                    style="border-color: var(--hairline)"
                    (click)="form.controls.amount.setValue(preset)"
                  >
                    {{ fmt.money(preset, currency(), { decimals: false }) }}
                  </button>
                }
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="lbl" for="reference">{{ t('transfer.reference') }}</label>
                <input
                  id="reference"
                  class="inp"
                  formControlName="reference"
                  [placeholder]="t('transfer.referencePlaceholder')"
                />
              </div>
              <div>
                <label class="lbl" for="date">{{ t('transfer.date') }}</label>
                <input id="date" type="date" class="inp" formControlName="executeOn" />
              </div>
            </div>

            <label class="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1">
              <input type="checkbox" class="peer sr-only" formControlName="savePayee" />
              <span
                class="grid size-5 shrink-0 place-items-center rounded-md border-2 text-transparent transition-all peer-checked:border-[var(--color-brand-500)] peer-checked:bg-[var(--color-brand-500)] peer-checked:text-white"
                style="border-color: var(--hairline)"
              >
                <app-icon name="check" [size]="13" [strokeWidth]="3" />
              </span>
              <span class="text-sm font-semibold">{{ t('transfer.savePayee') }}</span>
            </label>
          </section>
        }

        <!-- ================================================ step 3 -->
        @if (step() === 2) {
          <section class="card overflow-hidden animate-[rise_0.4s_var(--ease-spring)_both]">
            <div class="p-6 text-center text-white gradient-brand">
              <p class="text-[11px] font-bold uppercase tracking-[0.2em] opacity-75">
                {{ t('transfer.total') }}
              </p>
              <p class="mt-1 text-4xl font-extrabold tracking-tight tabular-nums">
                {{ fmt.money(amountValue(), currency()) }}
              </p>
            </div>
            <dl class="divide-y" style="border-color: var(--hairline)">
              @for (row of summary(); track row.label) {
                <div class="flex items-baseline justify-between gap-4 px-5 py-3.5">
                  <dt class="text-xs font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                    {{ row.label }}
                  </dt>
                  <dd class="truncate text-right text-sm font-bold" [class.font-mono]="row.mono">
                    {{ row.value }}
                  </dd>
                </div>
              }
            </dl>
          </section>
        }

        <!-- ================================================ success -->
        @if (step() === 3) {
          <section class="card p-10 text-center animate-[rise_0.45s_var(--ease-spring)_both]">
            <span
              class="mx-auto grid size-16 place-items-center rounded-full text-white animate-pulse-ring"
              style="background: var(--color-mint)"
            >
              <app-icon name="check" [size]="30" [strokeWidth]="2.6" />
            </span>
            <h3 class="mt-5 text-xl font-extrabold tracking-tight">{{ t('transfer.sent') }}</h3>
            <p class="mt-2 text-sm font-medium text-[var(--ink-soft)]">
              <strong class="font-extrabold text-[var(--ink)]">
                {{ fmt.money(sentAmount(), currency()) }}
              </strong>
              {{ t('transfer.sentBody') }}
              <strong class="font-extrabold text-[var(--ink)]">{{ sentTo() }}</strong>
            </p>
            <div class="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                class="rounded-xl px-5 py-2.5 text-sm font-bold text-white gradient-brand transition hover:shadow-[var(--shadow-glow)]"
                (click)="restart()"
              >
                {{ t('transfer.newTransfer') }}
              </button>
              <a
                routerLink="/dashboard"
                class="rounded-xl border px-5 py-2.5 text-sm font-bold text-[var(--ink-soft)] transition hover:bg-[var(--surface-sunken)]"
                style="border-color: var(--hairline)"
              >
                {{ t('transfer.done') }}
              </a>
            </div>
          </section>
        }

        <!-- ------------------------------------------------------ nav -->
        @if (step() < 3) {
          <div class="mt-5 flex gap-3">
            @if (step() > 0) {
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-xl border px-5 py-3 text-sm font-bold text-[var(--ink-soft)] transition hover:bg-[var(--surface-sunken)]"
                style="border-color: var(--hairline)"
                (click)="back()"
              >
                <app-icon name="chevronLeft" [size]="16" [strokeWidth]="2.3" />
                {{ t('transfer.back') }}
              </button>
            }
            <button
              type="submit"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white gradient-brand transition hover:shadow-[var(--shadow-glow)] active:scale-[0.99] disabled:opacity-55"
              [disabled]="busy()"
            >
              @if (busy()) {
                <span class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                {{ t('transfer.sending') }}
              } @else {
                {{ step() === 2 ? t('transfer.confirm') : t('transfer.next') }}
                <app-icon name="chevronRight" [size]="16" [strokeWidth]="2.3" />
              }
            </button>
          </div>
        }
      </form>
    </div>
  `,
  styles: `
    .lbl {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ink-faint);
    }
    .inp {
      margin-top: 0.4rem;
      width: 100%;
      height: 3rem;
      padding: 0 0.9rem;
      border: 1px solid var(--hairline);
      border-radius: 0.85rem;
      background: var(--surface-sunken);
      color: var(--ink);
      font-size: 0.9rem;
      font-weight: 600;
      outline: none;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }
    .inp:focus {
      border-color: var(--color-brand-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-brand-500) 16%, transparent);
    }
    .err {
      margin-top: 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-rose);
    }
  `,
})
export class Transfers {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(BankingStore);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly fmt = inject(FormatService);
  protected readonly t = inject(I18nService).t;

  protected readonly step = signal<Step>(0);
  protected readonly busy = signal(false);
  protected readonly sentAmount = signal(0);
  protected readonly sentTo = signal('');

  protected readonly stepLabels = ['transfer.step1', 'transfer.step2', 'transfer.step3'] as const;
  protected readonly presets = [20, 50, 100, 250, 500];

  protected readonly form = this.fb.nonNullable.group({
    fromAccountId: ['', Validators.required],
    payeeId: [null as string | null],
    payeeName: ['', [Validators.required, Validators.minLength(2)]],
    iban: ['', [Validators.required, ibanValidator]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    reference: [''],
    executeOn: [new Date().toISOString().slice(0, 10), Validators.required],
    savePayee: [false],
  });

  /** Form values mirrored as signals so the zoneless template stays reactive. */
  protected readonly selectedId = toSignal(this.form.controls.fromAccountId.valueChanges, {
    initialValue: this.form.controls.fromAccountId.value,
  });
  protected readonly selectedPayeeId = toSignal(this.form.controls.payeeId.valueChanges, {
    initialValue: this.form.controls.payeeId.value,
  });
  private readonly ibanValue = toSignal(this.form.controls.iban.valueChanges, {
    initialValue: this.form.controls.iban.value,
  });
  private readonly amountRaw = toSignal(this.form.controls.amount.valueChanges, {
    initialValue: this.form.controls.amount.value,
  });

  protected readonly sourceAccounts = computed<Account[]>(() =>
    this.store.accounts().filter((a) => a.kind === 'current' || a.kind === 'savings'),
  );

  protected readonly payees = computed<Payee[]>(() =>
    [...this.store.payees()].sort((a, b) => Number(b.favourite) - Number(a.favourite)),
  );

  private readonly selectedAccount = computed(
    () => this.sourceAccounts().find((a) => a.id === this.selectedId()) ?? null,
  );

  protected readonly currency = computed(() => this.selectedAccount()?.currency ?? 'EUR');
  protected readonly currencySymbol = computed(
    () => ({ EUR: '€', USD: '$', GBP: '£' })[this.currency()],
  );

  protected readonly amountValue = computed(() => Number(this.amountRaw() ?? 0));

  protected readonly ibanOk = computed(() => isValidIban(String(this.ibanValue() ?? '')));

  constructor() {
    // Preselect the first eligible account as soon as the seed data arrives.
    effect(() => {
      const first = this.sourceAccounts()[0];
      if (first && !this.form.controls.fromAccountId.value) {
        this.form.controls.fromAccountId.setValue(first.id);
      }
    });
  }

  protected invalid(name: 'payeeName' | 'iban' | 'amount'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  protected choosePayee(payee: Payee): void {
    this.form.patchValue({
      payeeId: payee.id,
      payeeName: payee.name,
      iban: payee.iban,
      savePayee: false,
    });
  }

  protected summary() {
    const account = this.selectedAccount();
    const remaining = (account?.available ?? 0) - this.amountValue();
    return [
      { label: this.t('transfer.from'), value: account?.nickname ?? account?.title ?? '—', mono: false },
      { label: this.t('transfer.name'), value: this.form.controls.payeeName.value, mono: false },
      { label: this.t('transfer.iban'), value: this.fmt.iban(this.form.controls.iban.value), mono: true },
      {
        label: this.t('transfer.reference'),
        value: this.form.controls.reference.value || '—',
        mono: false,
      },
      { label: this.t('transfer.date'), value: this.form.controls.executeOn.value, mono: false },
      { label: this.t('transfer.fee'), value: this.t('transfer.free'), mono: false },
      {
        label: this.t('transfer.remaining'),
        value: this.fmt.money(remaining, this.currency()),
        mono: false,
      },
    ];
  }

  protected back(): void {
    this.step.update((s) => Math.max(0, s - 1) as Step);
  }

  protected async next(): Promise<void> {
    if (this.step() === 0) {
      const controls = [this.form.controls.payeeName, this.form.controls.iban];
      controls.forEach((c) => c.markAsTouched());
      if (controls.some((c) => c.invalid) || !this.form.controls.fromAccountId.value) return;
      this.step.set(1);
      return;
    }

    if (this.step() === 1) {
      const amount = this.form.controls.amount;
      amount.markAsTouched();
      const available = this.selectedAccount()?.available ?? 0;
      if (this.amountValue() > available) {
        amount.setErrors({ overBalance: true });
        return;
      }
      if (amount.invalid) return;
      this.step.set(2);
      return;
    }

    await this.confirm();
  }

  private async confirm(): Promise<void> {
    this.busy.set(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const raw = this.form.getRawValue();
    this.store.executeTransfer({
      fromAccountId: raw.fromAccountId,
      payeeId: raw.payeeId,
      payeeName: raw.payeeName,
      iban: raw.iban,
      amount: Number(raw.amount ?? 0),
      currency: this.currency(),
      reference: raw.reference,
      executeOn: raw.executeOn,
      savePayee: raw.savePayee,
    });

    this.sentAmount.set(Number(raw.amount ?? 0));
    this.sentTo.set(raw.payeeName);
    this.busy.set(false);
    this.step.set(3);
    this.toasts.success(this.t('transfer.sent'));
  }

  protected restart(): void {
    const from = this.form.controls.fromAccountId.value;
    this.form.reset({
      fromAccountId: from,
      payeeId: null,
      payeeName: '',
      iban: '',
      amount: null,
      reference: '',
      executeOn: new Date().toISOString().slice(0, 10),
      savePayee: false,
    });
    this.step.set(0);
  }
}
