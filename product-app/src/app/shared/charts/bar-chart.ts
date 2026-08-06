import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface BarGroup {
  readonly key: string;
  readonly label: string;
  readonly primary: number;
  readonly secondary: number;
}

/**
 * Grouped bar chart built from DOM elements rather than SVG so the bars stay
 * crisp at any width and can carry native focus/hover affordances.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative">
      <!-- guide lines -->
      <div class="pointer-events-none absolute inset-x-0 top-0 grid" [style.height.px]="height()">
        @for (g of [0, 1, 2, 3, 4]; track g) {
          <div class="border-t border-dashed" style="border-color: var(--hairline)"></div>
        }
      </div>

      <div
        class="relative flex items-end gap-1.5 sm:gap-2.5"
        [style.height.px]="height()"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        @for (group of scaled(); track group.key; let i = $index) {
          <div
            class="group relative flex h-full flex-1 flex-col justify-end"
            (pointerenter)="active.set(group.key)"
            (pointerleave)="active.set(null)"
          >
            <div class="flex h-full items-end justify-center gap-[3px] sm:gap-1.5">
              <span
                class="bar w-full max-w-[14px] rounded-t-[5px]"
                [style.height.%]="group.primaryPct"
                [style.background]="primaryColor()"
                [style.animation-delay.ms]="i * 45"
                [style.opacity]="active() && active() !== group.key ? 0.4 : 1"
              ></span>
              <span
                class="bar w-full max-w-[14px] rounded-t-[5px]"
                [style.height.%]="group.secondaryPct"
                [style.background]="secondaryColor()"
                [style.animation-delay.ms]="i * 45 + 90"
                [style.opacity]="active() && active() !== group.key ? 0.4 : 1"
              ></span>
            </div>

            @if (active() === group.key) {
              <div
                class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-xl px-3 py-2 text-xs glass shadow-[var(--shadow-lift)]"
              >
                <div class="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                  {{ group.label }}
                </div>
                <div class="flex items-center gap-2 font-semibold">
                  <span class="size-2 rounded-full" [style.background]="primaryColor()"></span>
                  {{ primaryLabel() }}
                  <span class="ml-auto tabular-nums">{{ formatter()(group.primary) }}</span>
                </div>
                <div class="flex items-center gap-2 font-semibold">
                  <span class="size-2 rounded-full" [style.background]="secondaryColor()"></span>
                  {{ secondaryLabel() }}
                  <span class="ml-auto tabular-nums">{{ formatter()(group.secondary) }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="mt-2 flex gap-1.5 sm:gap-2.5">
        @for (group of scaled(); track group.key) {
          <div
            class="flex-1 text-center text-[11px] font-semibold tracking-wide transition-colors"
            [style.color]="active() === group.key ? 'var(--ink)' : 'var(--ink-faint)'"
          >
            {{ group.label }}
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .bar {
      transform-origin: bottom;
      animation: count-bar 0.7s var(--ease-spring) both;
      transition: opacity 0.2s ease;
      min-height: 3px;
    }
  `,
})
export class BarChart {
  readonly groups = input.required<BarGroup[]>();
  readonly height = input(180);
  readonly primaryColor = input('#10b981');
  readonly secondaryColor = input('#6b5bf5');
  readonly primaryLabel = input('Income');
  readonly secondaryLabel = input('Spend');
  readonly ariaLabel = input('Monthly cash flow');
  readonly formatter = input<(n: number) => string>((n) => String(Math.round(n)));

  protected readonly active = signal<string | null>(null);

  protected readonly scaled = computed(() => {
    const groups = this.groups();
    const max = Math.max(1, ...groups.flatMap((g) => [g.primary, g.secondary]));
    return groups.map((g) => ({
      ...g,
      primaryPct: (g.primary / max) * 100,
      secondaryPct: (g.secondary / max) * 100,
    }));
  });
}
