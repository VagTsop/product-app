import { computed, effect, Injectable, signal } from '@angular/core';

import { type Lang, TRANSLATIONS, type TranslationKey } from './translations';

const STORAGE_KEY = 'millenia.lang';
const LOCALE: Record<Lang, string> = { en: 'en-GB', el: 'el-GR' };

/**
 * Signal-based translation. `t` is an arrow property so components can expose
 * it directly (`readonly t = inject(I18nService).t`) and templates stay terse
 * while still tracking the language signal.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(readInitialLang());
  readonly locale = computed(() => LOCALE[this.lang()]);

  constructor() {
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* ignore */
      }
    });
  }

  readonly t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const table = TRANSLATIONS[this.lang()] as Record<string, string>;
    let value = table[key] ?? (TRANSLATIONS.en as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replace(`{${name}}`, String(replacement));
      }
    }
    return value;
  };

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  toggle(): void {
    this.lang.update((l) => (l === 'en' ? 'el' : 'en'));
  }
}

function readInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'el') return stored;
  } catch {
    /* ignore */
  }
  return navigator.language?.toLowerCase().startsWith('el') ? 'el' : 'en';
}
