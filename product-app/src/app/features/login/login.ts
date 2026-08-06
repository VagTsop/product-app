import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { I18nService } from '../../core/i18n/i18n.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from '../../shared/ui/icon';
import { LangToggle } from '../../shared/ui/lang-toggle';
import { ThemeToggle } from '../../shared/ui/theme-toggle';

interface LoginForm {
  username: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon, ThemeToggle, LangToggle],
  template: `
    <div class="relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]" style="background: var(--page)">
      <!-- ------------------------------------------------------- hero -->
      <section
        class="aurora relative hidden overflow-hidden px-12 py-14 lg:flex lg:flex-col"
        style="background: var(--surface-sunken)"
      >
        <div class="relative z-10 flex items-center gap-3">
          <span class="grid size-11 place-items-center rounded-2xl gradient-brand text-white shadow-[var(--shadow-glow)]">
            <svg viewBox="0 0 64 64" class="size-7" fill="currentColor" aria-hidden="true">
              <path d="M14 44V20h6.6l11.4 15.2L43.4 20H50v24h-6.4V30.6L32.6 45h-1.2L20.4 30.6V44z" />
            </svg>
          </span>
          <div>
            <div class="text-lg font-extrabold tracking-tight">{{ t('app.name') }}</div>
            <div class="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              {{ t('app.tagline') }}
            </div>
          </div>
        </div>

        <div class="relative z-10 my-auto max-w-lg py-10">
          <h2 class="text-[2.85rem] leading-[1.08] font-extrabold tracking-tight">
            <span class="text-gradient">{{ t('login.heroTitle') }}</span>
          </h2>
          <p class="mt-5 text-[15px] leading-relaxed font-medium text-[var(--ink-soft)]">
            {{ t('login.heroBody') }}
          </p>

          <!-- floating card mock -->
          <div class="relative mt-12 h-56 w-full max-w-md" aria-hidden="true">
            <div
              class="absolute top-6 left-8 h-44 w-72 rotate-[-8deg] rounded-2xl border opacity-70 backdrop-blur"
              style="border-color: var(--glass-border); background: var(--glass)"
            ></div>
            <div
              class="card-tilt absolute top-0 left-0 h-44 w-72 overflow-hidden rounded-2xl p-5 text-white shadow-[var(--shadow-lift)]"
              style="background: linear-gradient(135deg, #2e3275 0%, #5b3ee8 45%, #c026d3 100%)"
            >
              <div class="flex items-start justify-between">
                <span class="text-[11px] font-bold uppercase tracking-[0.2em] opacity-75">Millenia</span>
                <app-icon name="wifi" [size]="18" />
              </div>
              <div class="mt-9 h-8 w-11 rounded-md bg-white/25"></div>
              <div class="mt-5 font-mono text-[15px] tracking-[0.16em] opacity-95">
                4165 •••• •••• 8593
              </div>
              <div class="mt-3 flex items-end justify-between text-[10px] font-semibold tracking-wider opacity-80">
                <span>ELENA MARINOS</span>
                <span>07/29</span>
              </div>
            </div>
          </div>
        </div>

        <dl class="relative z-10 grid max-w-lg grid-cols-3 gap-6">
          @for (stat of stats; track stat.key) {
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">
                {{ t(stat.key) }}
              </dt>
              <dd class="mt-1 text-2xl font-extrabold tracking-tight">{{ stat.value }}</dd>
            </div>
          }
        </dl>
      </section>

      <!-- ------------------------------------------------------- form -->
      <section class="relative flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 lg:hidden">
            <span class="grid size-9 place-items-center rounded-xl gradient-brand text-white">
              <svg viewBox="0 0 64 64" class="size-6" fill="currentColor" aria-hidden="true">
                <path d="M14 44V20h6.6l11.4 15.2L43.4 20H50v24h-6.4V30.6L32.6 45h-1.2L20.4 30.6V44z" />
              </svg>
            </span>
            <span class="text-base font-extrabold tracking-tight">{{ t('app.name') }}</span>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <app-lang-toggle />
            <app-theme-toggle />
          </div>
        </div>

        <div class="my-auto w-full max-w-[26rem] self-center py-10">
          <div class="stagger">
            <h1 class="text-3xl font-extrabold tracking-tight sm:text-[2.1rem]" style="--i: 0">
              {{ t('login.greeting') }}
            </h1>
            <p class="mt-2 text-sm font-medium text-[var(--ink-soft)]" style="--i: 1">
              {{ t('login.subtitle') }}
            </p>
          </div>

          <form class="mt-8 space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field" [class.field-error]="showError('username')">
              <label class="field-label" for="username">{{ t('login.username') }}</label>
              <div class="field-shell">
                <app-icon name="user" [size]="18" />
                <input
                  id="username"
                  type="text"
                  formControlName="username"
                  autocomplete="username"
                  class="field-input"
                  placeholder="admin"
                />
              </div>
              @if (showError('username')) {
                <p class="field-hint">{{ t('login.usernameRequired') }}</p>
              }
            </div>

            <div class="field" [class.field-error]="showError('password')">
              <label class="field-label" for="password">{{ t('login.password') }}</label>
              <div class="field-shell">
                <app-icon name="lock" [size]="18" />
                <input
                  id="password"
                  [type]="revealed() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  class="field-input"
                  placeholder="•••"
                />
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-lg text-[var(--ink-faint)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
                  (click)="revealed.set(!revealed())"
                  [attr.aria-label]="revealed() ? t('login.hidePassword') : t('login.showPassword')"
                >
                  <app-icon [name]="revealed() ? 'eyeOff' : 'eye'" [size]="17" />
                </button>
              </div>
              @if (showError('password')) {
                <p class="field-hint">{{ t('login.passwordRequired') }}</p>
              }
            </div>

            @if (failed()) {
              <div
                class="flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold animate-[rise_0.35s_var(--ease-spring)_both]"
                style="background: color-mix(in oklab, var(--color-rose) 14%, transparent); color: var(--color-rose)"
                role="alert"
              >
                <app-icon name="warning" [size]="17" [strokeWidth]="2.2" />
                {{ t('login.invalid') }}
              </div>
            }

            <div class="flex justify-end">
              <a class="text-xs font-bold text-[var(--color-brand-500)] hover:underline" href="#" (click)="$event.preventDefault()">
                {{ t('login.forgot') }}
              </a>
            </div>

            <button
              type="submit"
              class="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold tracking-wide text-white gradient-brand transition-all duration-300 hover:shadow-[var(--shadow-glow)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55"
              [disabled]="busy()"
            >
              @if (busy()) {
                <span class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                {{ t('login.signingIn') }}
              } @else {
                {{ t('login.submit') }}
                <app-icon name="arrowUpRight" [size]="16" [strokeWidth]="2.4" />
              }
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--surface-sunken)]"
              style="border-color: var(--hairline)"
              (click)="fillDemo()"
            >
              <app-icon name="sparkles" [size]="15" />
              {{ t('login.demoHint') }}: admin / 123
            </button>
          </form>

          <p class="mt-7 text-center text-sm font-medium text-[var(--ink-soft)]">
            {{ t('login.noAccount') }}
            <a class="ml-1 font-bold text-[var(--color-brand-500)] hover:underline" href="#" (click)="$event.preventDefault()">
              {{ t('login.signup') }}
            </a>
          </p>
        </div>

        <p class="text-center text-[11px] font-medium text-[var(--ink-faint)]">
          {{ t('login.footer') }}
        </p>
      </section>
    </div>
  `,
  styles: `
    .field-label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ink-faint);
    }
    .field-shell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      height: 3rem;
      padding: 0 0.6rem 0 0.9rem;
      border: 1px solid var(--hairline);
      border-radius: 0.85rem;
      background: var(--surface-raised);
      color: var(--ink-faint);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }
    .field-shell:focus-within {
      border-color: var(--color-brand-500);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-brand-500) 18%, transparent);
      color: var(--color-brand-500);
    }
    .field-input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--ink);
      font-size: 0.925rem;
      font-weight: 600;
    }
    .field-input::placeholder {
      color: var(--ink-faint);
      font-weight: 500;
    }
    .field-error .field-shell {
      border-color: var(--color-rose);
    }
    .field-hint {
      margin-top: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-rose);
    }
    .card-tilt {
      animation: float 11s ease-in-out infinite;
    }
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastService);

  protected readonly t = inject(I18nService).t;
  protected readonly revealed = signal(false);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected readonly stats = [
    { key: 'login.stat1', value: '99.98%' },
    { key: 'login.stat2', value: '27' },
    { key: 'login.stat3', value: '1.4M' },
  ] as const;

  protected readonly form = this.fb.nonNullable.group<LoginForm>({
    username: this.fb.nonNullable.control('', Validators.required),
    password: this.fb.nonNullable.control('', Validators.required),
  });

  private readonly redirect = computed(
    () => this.route.snapshot.queryParamMap.get('redirect') ?? '/dashboard',
  );

  protected showError(name: 'username' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  protected fillDemo(): void {
    this.form.setValue({ username: 'admin', password: '123' });
    this.failed.set(false);
  }

  protected async submit(): Promise<void> {
    this.failed.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    const { username, password } = this.form.getRawValue();
    const ok = await this.auth.login(username, password);
    this.busy.set(false);

    if (!ok) {
      this.failed.set(true);
      this.form.controls.password.reset();
      return;
    }

    this.toasts.success(`${this.t('login.greeting')}, ${this.auth.displayName()}`);
    void this.router.navigateByUrl(this.redirect());
  }
}
