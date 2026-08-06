import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Tiny inline-SVG icon set (24×24, stroke-based) so the app ships no icon-font
 * dependency and icons inherit `currentColor` in both themes.
 */
export const ICONS = {
  dashboard: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z',
  wallet:
    'M3 8a3 3 0 0 1 3-3h11a2 2 0 0 1 2 2v1M3 8v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-2M3 8h15a3 3 0 0 1 3 3v1h-4a2 2 0 0 0 0 4h4',
  card: 'M2 8a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8Zm0 3h20M6 15h3',
  transfer: 'M4 9h13l-3-3m3 3-3 3M20 15H7l3-3m-3 3 3 3',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  bell: 'M18 8a6 6 0 1 0-12 0c0 6-3 7-3 7h18s-3-1-3-7M13.7 21a2 2 0 0 1-3.4 0',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z',
  chevronRight: 'm9 6 6 6-6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  chevronDown: 'm6 9 6 6 6-6',
  arrowUpRight: 'M7 17 17 7M8 7h9v9',
  arrowDownLeft: 'M17 7 7 17M16 17H7V8',
  plus: 'M12 5v14M5 12h14',
  check: 'm4 12 5 5L20 6',
  x: 'M18 6 6 18M6 6l12 12',
  copy: 'M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3M5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.3A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.2 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.9 9.9 0 0 0 4.2-.9',
  snowflake:
    'M12 2v20M4.2 6.5l15.6 9M19.8 6.5l-15.6 9M12 6l-2.5-2.5M12 6l2.5-2.5M12 18l-2.5 2.5M12 18l2.5 2.5',
  lock: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 19h16',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  trend: 'm3 17 6-6 4 4 8-8M15 7h6v6',
  shield: 'M12 22s8-3.5 8-10V5.5L12 2 4 5.5V12c0 6.5 8 10 8 10Z',
  headset: 'M4 14v-2a8 8 0 1 1 16 0v2M4 14a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2Zm0 2v1a4 4 0 0 1-4 4h-2',
  document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h4',
  sparkles: 'M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3ZM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6M9 21h.01M18 21h.01',
  cutlery: 'M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-1.7 1-2.5 3-2.5 5.5S15.3 13 17 13v8',
  car: 'M5 16h14M6 16v2H4v-2m14 0v2h2v-2M4.5 12l1.6-4.5A2 2 0 0 1 8 6h8a2 2 0 0 1 1.9 1.5L19.5 12M4 12h16v4H4v-4Zm3 2h.01M17 14h.01',
  receipt: 'M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Zm3 5h8M8 12h8M8 16h5',
  film: 'M3 5h18v14H3V5Zm0 4h18M3 15h18M8 5v14M16 5v14',
  heart: 'M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 7a4 4 0 0 1 7 3.7C19 15.6 12 20 12 20Z',
  plane: 'M10.5 13.5 3 11l1-2 8.5 1.5L18 4.5a2 2 0 0 1 3 2.6l-4.5 6L18 21l-2 1-4-6.5-4 1.5-.5 3-2-.5.5-4Z',
  bank: 'M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M12 3 3 8h18l-9-5Z',
  briefcase: 'M4 8h16v12H4V8Zm5 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16',
  pencil: 'M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Zm9-13 4 4',
  calendar: 'M4 6h16v15H4V6Zm0 5h16M8 3v4M16 3v4',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14h.01M11 12h1v5h1',
  warning: 'M12 3 2 20h20L12 3Zm0 6v5m0 3h.01',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M1.5 9a15 15 0 0 1 21 0',
  menu: 'M4 7h16M4 12h16M4 17h16',
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly strokeWidth = input(1.7);

  protected readonly path = computed(() => ICONS[this.name()]);
}
