import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';

/** Two-state EN/EL segmented control with an animated sliding indicator. */
@Component({
  selector: 'app-lang-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex h-10 items-center rounded-xl border p-1"
      style="border-color: var(--hairline); background: var(--surface-raised)"
      role="group"
      [attr.aria-label]="t('common.language')"
    >
      <span
        class="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-lg gradient-brand transition-transform duration-300"
        style="transition-timing-function: var(--ease-spring)"
        [style.transform]="i18n.lang() === 'el' ? 'translateX(100%)' : 'translateX(0)'"
      ></span>
      @for (option of options; track option.code) {
        <button
          type="button"
          class="relative z-10 w-10 rounded-lg text-xs font-bold tracking-wide transition-colors duration-200"
          [style.color]="i18n.lang() === option.code ? '#fff' : 'var(--ink-soft)'"
          [attr.aria-pressed]="i18n.lang() === option.code"
          (click)="i18n.setLang(option.code)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class LangToggle {
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly options = [
    { code: 'en', label: 'EN' },
    { code: 'el', label: 'ΕΛ' },
  ] as const;
}
