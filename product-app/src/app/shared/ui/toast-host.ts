import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService, type ToastTone } from '../../core/services/toast.service';
import { Icon, type IconName } from './icon';

const TONE_ICON: Record<ToastTone, IconName> = {
  success: 'check',
  info: 'info',
  warning: 'warning',
  error: 'x',
};

const TONE_COLOR: Record<ToastTone, string> = {
  success: '#10b981',
  info: '#6b5bf5',
  warning: '#f59e0b',
  error: '#f43f5e',
};

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:top-5 sm:right-5 sm:left-auto sm:items-end sm:px-0"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 glass shadow-[var(--shadow-lift)] animate-[rise_0.4s_var(--ease-spring)_both]"
        >
          <span
            class="grid size-8 shrink-0 place-items-center rounded-full text-white"
            [style.background]="color(toast.tone)"
          >
            <app-icon [name]="icon(toast.tone)" [size]="16" [strokeWidth]="2.4" />
          </span>
          <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-full text-[var(--ink-faint)] transition hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
            (click)="toasts.dismiss(toast.id)"
            aria-label="Dismiss"
          >
            <app-icon name="x" [size]="15" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
  protected readonly icon = (tone: ToastTone): IconName => TONE_ICON[tone];
  protected readonly color = (tone: ToastTone): string => TONE_COLOR[tone];
}
