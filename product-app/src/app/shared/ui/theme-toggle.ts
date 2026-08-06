import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/services/theme.service';
import { Icon } from './icon';

/** Sun/moon switch with a sliding thumb — the two icons cross-fade on toggle. */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button
      type="button"
      class="relative grid size-10 place-items-center rounded-xl border transition-all duration-300 hover:shadow-[var(--shadow-card)]"
      style="border-color: var(--hairline); background: var(--surface-raised)"
      [attr.aria-label]="t('common.theme')"
      [attr.aria-pressed]="theme.mode() === 'dark'"
      [title]="t('common.theme')"
      (click)="theme.toggle()"
    >
      <span
        class="absolute transition-all duration-400"
        [style.opacity]="theme.mode() === 'dark' ? 0 : 1"
        [style.transform]="theme.mode() === 'dark' ? 'rotate(-90deg) scale(0.4)' : 'none'"
      >
        <app-icon name="sun" [size]="18" />
      </span>
      <span
        class="absolute transition-all duration-400"
        [style.opacity]="theme.mode() === 'dark' ? 1 : 0"
        [style.transform]="theme.mode() === 'dark' ? 'none' : 'rotate(90deg) scale(0.4)'"
      >
        <app-icon name="moon" [size]="18" />
      </span>
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly t = inject(I18nService).t;
}
