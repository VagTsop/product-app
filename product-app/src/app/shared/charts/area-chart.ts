import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

const W = 640;
const H = 128;
const PAD_X = 6;
const PAD_TOP = 12;
const PAD_BOTTOM = 10;

interface Point {
  x: number;
  y: number;
  value: number;
  label: string;
}

/**
 * Smoothed area/line chart driven entirely by signals. The line draws itself on
 * mount with a stroke-dashoffset animation, and hovering snaps a marker to the
 * nearest data point.
 */
@Component({
  selector: 'app-area-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block relative' },
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + W + ' ' + H"
      class="w-full h-auto overflow-visible"
      role="img"
      [attr.aria-label]="ariaLabel()"
      (pointermove)="onMove($event)"
      (pointerleave)="active.set(null)"
    >
      <defs>
        <linearGradient [attr.id]="fillId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.35" />
          <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
        </linearGradient>
        <linearGradient [attr.id]="strokeId" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" [attr.stop-color]="color()" />
          <stop offset="100%" [attr.stop-color]="colorEnd()" />
        </linearGradient>
      </defs>

      <!-- horizontal guides -->
      @for (g of guides(); track g) {
        <line
          [attr.x1]="PAD_X"
          [attr.x2]="W - PAD_X"
          [attr.y1]="g"
          [attr.y2]="g"
          stroke="currentColor"
          stroke-opacity="0.09"
          stroke-dasharray="3 6"
        />
      }

      <path [attr.d]="areaPath()" [attr.fill]="'url(#' + fillId + ')'" class="animate-[fade_0.9s_ease_both]" />

      <path
        [attr.d]="linePath()"
        fill="none"
        [attr.stroke]="'url(#' + strokeId + ')'"
        stroke-width="2.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chart-line"
      />

      @if (activePoint(); as p) {
        <line
          [attr.x1]="p.x"
          [attr.x2]="p.x"
          [attr.y1]="PAD_TOP - 10"
          [attr.y2]="H - PAD_BOTTOM"
          stroke="currentColor"
          stroke-opacity="0.25"
        />
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="9" [attr.fill]="color()" fill-opacity="0.18" />
        <circle
          [attr.cx]="p.x"
          [attr.cy]="p.y"
          r="4.5"
          [attr.fill]="color()"
          stroke="var(--surface-raised)"
          stroke-width="2.5"
        />
      } @else if (points().length) {
        <circle
          [attr.cx]="points()[points().length - 1].x"
          [attr.cy]="points()[points().length - 1].y"
          r="4.5"
          [attr.fill]="color()"
          stroke="var(--surface-raised)"
          stroke-width="2.5"
          class="animate-[fade_1.2s_ease_both]"
        />
      }
    </svg>

    @if (activePoint(); as p) {
      <div
        class="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap glass shadow-[var(--shadow-lift)]"
        [style.left.%]="(p.x / W) * 100"
        [style.top.%]="(p.y / H) * 100"
      >
        <span class="block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">
          {{ p.label }}
        </span>
        {{ formatter()(p.value) }}
      </div>
    }
  `,
  styles: `
    .chart-line {
      stroke-dasharray: 2200;
      stroke-dashoffset: 2200;
      animation: draw 1.5s var(--ease-spring) forwards;
    }
  `,
})
export class AreaChart {
  readonly values = input.required<number[]>();
  readonly labels = input<string[]>([]);
  readonly color = input('#6b5bf5');
  readonly colorEnd = input('#c026d3');
  readonly ariaLabel = input('Trend chart');
  readonly formatter = input<(n: number) => string>((n) => String(Math.round(n)));

  protected readonly W = W;
  protected readonly H = H;
  protected readonly PAD_X = PAD_X;
  protected readonly PAD_TOP = PAD_TOP;
  protected readonly PAD_BOTTOM = PAD_BOTTOM;

  protected readonly fillId = `area-fill-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly strokeId = `area-stroke-${Math.random().toString(36).slice(2, 8)}`;

  protected readonly active = signal<number | null>(null);

  protected readonly points = computed<Point[]>(() => {
    const values = this.values();
    if (values.length === 0) return [];
    const labels = this.labels();
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || Math.abs(max) || 1;
    const usable = H - PAD_TOP - PAD_BOTTOM;
    const step = values.length > 1 ? (W - PAD_X * 2) / (values.length - 1) : 0;

    return values.map((value, i) => ({
      x: PAD_X + step * i,
      y: PAD_TOP + usable - ((value - min) / span) * usable,
      value,
      label: labels[i] ?? String(i + 1),
    }));
  });

  protected readonly guides = computed(() => {
    const usable = H - PAD_TOP - PAD_BOTTOM;
    return [0, 0.25, 0.5, 0.75, 1].map((r) => PAD_TOP + usable * r);
  });

  protected readonly linePath = computed(() => smoothPath(this.points()));

  protected readonly areaPath = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '';
    const base = H - PAD_BOTTOM;
    return `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${base} L ${pts[0].x} ${base} Z`;
  });

  protected readonly activePoint = computed(() => {
    const index = this.active();
    return index === null ? null : (this.points()[index] ?? null);
  });

  protected onMove(event: PointerEvent): void {
    const target = event.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const count = this.values().length;
    if (count === 0) return;
    this.active.set(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
  }
}

/** Catmull-Rom → cubic Bézier, which keeps the curve through every point. */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`;
  }
  return d;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
