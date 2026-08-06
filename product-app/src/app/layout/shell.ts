import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { I18nService } from '../core/i18n/i18n.service';
import type { TranslationKey } from '../core/i18n/translations';
import { AuthService } from '../core/services/auth.service';
import { BankingStore } from '../core/services/banking-store';
import { Icon, type IconName } from '../shared/ui/icon';
import { LangToggle } from '../shared/ui/lang-toggle';
import { ThemeToggle } from '../shared/ui/theme-toggle';

interface NavItem {
  readonly path: string;
  readonly labelKey: TranslationKey;
  readonly icon: IconName;
}

const NAV: NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { path: '/accounts', labelKey: 'nav.accounts', icon: 'wallet' },
  { path: '/cards', labelKey: 'nav.cards', icon: 'card' },
  { path: '/transfers', labelKey: 'nav.transfers', icon: 'transfer' },
  { path: '/transactions', labelKey: 'nav.transactions', icon: 'list' },
];

/**
 * Application chrome: a collapsible desktop rail, a slide-over drawer for
 * tablets, and a bottom tab bar on phones. The routed page renders in the
 * middle column.
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, ThemeToggle, LangToggle],
  template: `
    <div class="flex min-h-dvh" style="background: var(--page)">
      <!-- ---------------------------------------------------------- rail -->
      <aside
        class="fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0"
        style="border-color: var(--hairline); background: var(--surface-raised); transition-timing-function: var(--ease-spring)"
        [style.width.px]="collapsed() ? 84 : 264"
        [class.-translate-x-full]="!drawerOpen()"
      >
        <div class="flex h-[72px] items-center gap-3 px-5">
          <a
            routerLink="/dashboard"
            class="grid size-10 shrink-0 place-items-center rounded-xl gradient-brand text-white shadow-[var(--shadow-glow)]"
            aria-label="Millenia"
          >
            <svg viewBox="0 0 64 64" class="size-6" fill="currentColor" aria-hidden="true">
              <path d="M14 44V20h6.6l11.4 15.2L43.4 20H50v24h-6.4V30.6L32.6 45h-1.2L20.4 30.6V44z" />
            </svg>
          </a>
          @if (!collapsed()) {
            <div class="min-w-0 animate-[fade_0.3s_ease_both]">
              <div class="truncate text-[15px] font-extrabold tracking-tight">{{ t('app.name') }}</div>
              <div class="truncate text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-faint)]">
                {{ t('app.tagline') }}
              </div>
            </div>
          }
          <button
            type="button"
            class="ml-auto grid size-8 place-items-center rounded-lg text-[var(--ink-faint)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)] lg:hidden"
            (click)="drawerOpen.set(false)"
            [attr.aria-label]="t('common.close')"
          >
            <app-icon name="x" [size]="18" />
          </button>
        </div>

        <nav class="flex-1 space-y-1 px-3 py-4" [attr.aria-label]="t('nav.menu')">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="nav-active"
              class="nav-link group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition-all duration-200"
              [attr.title]="collapsed() ? t(item.labelKey) : null"
              (click)="drawerOpen.set(false)"
            >
              <app-icon [name]="item.icon" [size]="20" />
              @if (!collapsed()) {
                <span class="truncate">{{ t(item.labelKey) }}</span>
              }
            </a>
          }
        </nav>

        <div class="px-3 pb-4">
          @if (!collapsed()) {
            <div
              class="mb-3 overflow-hidden rounded-2xl p-4 text-white gradient-brand animate-[rise_0.5s_var(--ease-spring)_both]"
            >
              <div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-80">
                <app-icon name="sparkles" [size]="14" />
                {{ profileTier() }}
              </div>
              <p class="mt-2 text-sm leading-snug font-semibold opacity-95">
                {{ t('dash.support') }} 24/7
              </p>
              <a
                routerLink="/transfers"
                class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur transition hover:bg-white/30"
              >
                {{ t('dash.sendMoney') }}
                <app-icon name="arrowUpRight" [size]="13" [strokeWidth]="2.4" />
              </a>
            </div>
          }

          <button
            type="button"
            class="hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--ink-faint)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)] lg:flex"
            (click)="collapsed.set(!collapsed())"
          >
            <span [style.transform]="collapsed() ? 'rotate(180deg)' : null" class="transition-transform duration-300">
              <app-icon name="chevronLeft" [size]="20" />
            </span>
            @if (!collapsed()) {
              <span>Collapse</span>
            }
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--ink-faint)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--color-rose)]"
            (click)="signOut()"
          >
            <app-icon name="logout" [size]="20" />
            @if (!collapsed()) {
              <span>{{ t('nav.signOut') }}</span>
            }
          </button>
        </div>
      </aside>

      @if (drawerOpen()) {
        <div
          class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-[fade_0.25s_ease_both] lg:hidden"
          (click)="drawerOpen.set(false)"
        ></div>
      }

      <!-- ------------------------------------------------------- content -->
      <div class="flex min-w-0 flex-1 flex-col">
        <header
          class="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b px-4 glass sm:px-6"
          style="border-color: var(--hairline)"
        >
          <button
            type="button"
            class="grid size-10 place-items-center rounded-xl border transition hover:bg-[var(--surface-sunken)] lg:hidden"
            style="border-color: var(--hairline)"
            (click)="drawerOpen.set(true)"
            [attr.aria-label]="t('nav.menu')"
          >
            <app-icon name="menu" [size]="20" />
          </button>

          <div class="min-w-0 flex-1">
            <h1 class="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              {{ pageTitle() }}
            </h1>
            <p class="hidden truncate text-xs font-medium text-[var(--ink-faint)] sm:block">
              {{ today() }}
            </p>
          </div>

          <div class="hidden sm:block"><app-lang-toggle /></div>
          <app-theme-toggle />

          <button
            type="button"
            class="relative grid size-10 place-items-center rounded-xl border transition hover:bg-[var(--surface-sunken)]"
            style="border-color: var(--hairline); background: var(--surface-raised)"
            aria-label="Notifications"
          >
            <app-icon name="bell" [size]="18" />
            <span
              class="absolute top-2 right-2.5 size-2 rounded-full"
              style="background: var(--color-rose)"
            ></span>
          </button>

          <div class="flex items-center gap-2.5 rounded-xl border py-1.5 pr-3 pl-1.5"
               style="border-color: var(--hairline); background: var(--surface-raised)">
            <span
              class="grid size-8 place-items-center rounded-lg text-xs font-extrabold text-white gradient-brand"
            >
              {{ auth.initials() }}
            </span>
            <span class="hidden text-sm font-bold md:block">{{ auth.displayName() }}</span>
          </div>
        </header>

        <main class="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-6 lg:pb-8">
          <router-outlet />
        </main>
      </div>

      <!-- ---------------------------------------------------- bottom tabs -->
      <nav
        class="fixed inset-x-0 bottom-0 z-40 flex border-t px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] glass lg:hidden"
        style="border-color: var(--hairline)"
        [attr.aria-label]="t('nav.menu')"
      >
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="tab-active"
            class="tab-link flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold text-[var(--ink-faint)] transition-colors"
          >
            <app-icon [name]="item.icon" [size]="20" />
            <span class="truncate">{{ t(item.labelKey) }}</span>
          </a>
        }
      </nav>
    </div>
  `,
  styles: `
    .nav-link:hover {
      background: var(--surface-sunken);
      color: var(--ink);
    }
    .nav-link.nav-active {
      color: #fff;
      background-image: linear-gradient(
        120deg,
        var(--color-brand-600) 0%,
        var(--color-brand-500) 40%,
        var(--color-magenta) 100%
      );
      box-shadow: var(--shadow-glow);
    }
    .tab-link.tab-active {
      color: var(--color-brand-500);
      background: color-mix(in oklab, var(--color-brand-500) 12%, transparent);
    }
  `,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly store = inject(BankingStore);

  protected readonly auth = inject(AuthService);
  protected readonly t = this.i18n.t;
  protected readonly nav = NAV;

  protected readonly collapsed = signal(false);
  protected readonly drawerOpen = signal(false);

  protected readonly profileTier = computed(() => this.store.profile()?.tier ?? 'Private');

  /** `router.url` is not reactive, so mirror NavigationEnd into a signal. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly pageTitle = computed(() => {
    const url = this.currentUrl().split('?')[0];
    const match = NAV.find((item) => url.startsWith(item.path));
    return this.t(match ? match.labelKey : 'nav.dashboard');
  });

  protected readonly today = computed(() =>
    new Date().toLocaleDateString(this.i18n.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
