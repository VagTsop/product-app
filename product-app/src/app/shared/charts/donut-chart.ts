import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface DonutSlice {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

interface Arc extends DonutSlice {
  readonly d: string;
  readonly share: number;
  readonly index: number;
}

const SIZE = 220;
const R_OUTER = 96;
const R_INNER = 66;

/** Donut with hover-to-lift arcs and a signal-driven centre readout. */
@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div class="relative shrink-0">
        <svg
          [attr.viewBox]="'0 0 ' + SIZE + ' ' + SIZE"
          class="h-[200px] w-[200px]"
          role="img"
          [attr.aria-label]="ariaLabel()"
        >
          @for (arc of arcs(); track arc.key) {
            <path
              [attr.d]="arc.d"
              [attr.fill]="arc.color"
              class="arc origin-center cursor-pointer transition-[transform,opacity] duration-300"
              [style.animation-delay.ms]="arc.index * 70"
              [style.transform]="active() === arc.key ? 'scale(1.055)' : 'scale(1)'"
              [style.opacity]="active() && active() !== arc.key ? 0.35 : 1"
              (pointerenter)="active.set(arc.key)"
              (pointerleave)="active.set(null)"
            />
          }
        </svg>

        <div class="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
              {{ centreLabel() }}
            </div>
            <div class="mt-0.5 text-xl font-extrabold tracking-tight">
              {{ centreValue() }}
            </div>
          </div>
        </div>
      </div>

      <ul class="grid w-full min-w-0 gap-1.5">
        @for (arc of arcs(); track arc.key) {
          <li
            class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
            [style.background]="active() === arc.key ? 'var(--surface-sunken)' : 'transparent'"
            (pointerenter)="active.set(arc.key)"
            (pointerleave)="active.set(null)"
          >
            <span class="size-2.5 rounded-full" [style.background]="arc.color"></span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ arc.label }}</span>
            <span class="shrink-0 tabular-nums text-xs font-semibold text-[var(--ink-soft)]">
              {{ (arc.share * 100).toFixed(0) }}%
            </span>
            <span class="shrink-0 text-right tabular-nums text-sm font-semibold">
              {{ formatter()(arc.value) }}
            </span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .arc {
      transform-box: fill-box;
      animation: fade 0.5s ease both;
    }
  `,
})
export class DonutChart {
  readonly slices = input.required<DonutSlice[]>();
  readonly centreLabel = input('Total');
  readonly ariaLabel = input('Category breakdown');
  readonly formatter = input<(n: number) => string>((n) => String(Math.round(n)));

  protected readonly SIZE = SIZE;
  protected readonly active = signal<string | null>(null);

  private readonly total = computed(() =>
    this.slices().reduce((sum, s) => sum + s.value, 0),
  );

  protected readonly centreValue = computed(() => {
    const key = this.active();
    const slice = key ? this.slices().find((s) => s.key === key) : null;
    return this.formatter()(slice ? slice.value : this.total());
  });

  protected readonly arcs = computed<Arc[]>(() => {
    const slices = this.slices();
    const total = this.total();
    if (!total) return [];

    const gap = slices.length > 1 ? 0.022 : 0;
    let cursor = -Math.PI / 2;

    return slices.map((slice, index) => {
      const share = slice.value / total;
      const sweep = share * Math.PI * 2;
      const start = cursor + gap / 2;
      const end = cursor + sweep - gap / 2;
      cursor += sweep;
      return { ...slice, share, index, d: ringSegment(start, Math.max(start + 0.001, end)) };
    });
  });
}

function ringSegment(start: number, end: number): string {
  const c = SIZE / 2;
  const large = end - start > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
  return [
    `M ${p(R_OUTER, start)}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${p(R_OUTER, end)}`,
    `L ${p(R_INNER, end)}`,
    `A ${R_INNER} ${R_INNER} 0 ${large} 0 ${p(R_INNER, start)}`,
    'Z',
  ].join(' ');
}
