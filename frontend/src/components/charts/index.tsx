import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

export const CHART_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

interface ChartSeries {
  key: string;
  name: string;
  color?: string;
}

function useChartPalette() {
  const { isDark } = useTheme();
  return {
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axis: isDark ? '#64748b' : '#94a3b8',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#e2e8f0',
    tooltipText: isDark ? '#f1f5f9' : '#0f172a',
    tooltipDim: isDark ? '#94a3b8' : '#64748b',
  };
}

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
  formatter?: (value: number) => string;
}

function ChartTooltip({ active, label, payload, formatter }: ChartTooltipProps) {
  const palette = useChartPalette();
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-xl border px-3.5 py-2.5 shadow-xl"
      style={{ background: palette.tooltipBg, borderColor: palette.tooltipBorder }}
    >
      <p className="mb-1 text-xs font-bold" style={{ color: palette.tooltipText }}>
        {label}
      </p>
      {payload.map((item, i) => (
        <p key={i} className="flex items-center gap-2 text-xs" style={{ color: palette.tooltipDim }}>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: item.color ?? CHART_COLORS[0] }}
          />
          <span className="capitalize">{item.name}</span>
          <span className="font-bold" style={{ color: palette.tooltipText }}>
            {typeof item.value === 'number' && formatter ? formatter(item.value) : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}

interface AxisProps {
  formatter?: (value: number) => string;
  hideY?: boolean;
}

function ChartAxes({ formatter, hideY = false }: AxisProps) {
  const palette = useChartPalette();
  return (
    <>
      <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fill: palette.axis, fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        dy={6}
      />
      <YAxis
        hide={hideY}
        tick={{ fill: palette.axis, fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={48}
        tickFormatter={formatter}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Chart card wrapper                                                  */
/* ------------------------------------------------------------------ */

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  height?: number;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, actions, height = 260, children, className }: ChartCardProps) {
  return (
    <div className={`card p-5 ${className ?? ''}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Area trend chart                                                    */
/* ------------------------------------------------------------------ */

interface AreaTrendChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  formatter?: (value: number) => string;
  height?: number;
  stacked?: boolean;
}

export function AreaTrendChart({ data, series, formatter, height = 260, stacked = false }: AreaTrendChartProps) {
  const palette = useChartPalette();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color ?? CHART_COLORS[i]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color ?? CHART_COLORS[i]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <ChartAxes formatter={formatter} />
          <Tooltip
            content={<ChartTooltip formatter={formatter} />}
            cursor={{ stroke: palette.grid, strokeDasharray: '3 3' }}
          />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? CHART_COLORS[i]}
              strokeWidth={2.5}
              fill={`url(#grad-${s.key})`}
              stackId={stacked ? 'stack' : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: palette.tooltipBg }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bar trend chart                                                     */
/* ------------------------------------------------------------------ */

interface BarTrendChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  formatter?: (value: number) => string;
  height?: number;
  stacked?: boolean;
  rounded?: boolean;
}

export function BarTrendChart({
  data,
  series,
  formatter,
  height = 260,
  stacked = false,
  rounded = true,
}: BarTrendChartProps) {
  const palette = useChartPalette();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <ChartAxes formatter={formatter} />
          <Tooltip
            content={<ChartTooltip formatter={formatter} />}
            cursor={{ fill: palette.grid, opacity: 0.4 }}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color ?? CHART_COLORS[i]}
              stackId={stacked ? 'stack' : undefined}
              radius={rounded && !stacked ? [6, 6, 0, 0] : stacked ? [0, 0, 0, 0] : undefined}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Line trend chart                                                    */
/* ------------------------------------------------------------------ */

interface LineTrendChartProps {
  data: Record<string, string | number>[];
  series: ChartSeries[];
  formatter?: (value: number) => string;
  height?: number;
}

export function LineTrendChart({ data, series, formatter, height = 260 }: LineTrendChartProps) {
  const palette = useChartPalette();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <ChartAxes formatter={formatter} />
          <Tooltip
            content={<ChartTooltip formatter={formatter} />}
            cursor={{ stroke: palette.grid, strokeDasharray: '3 3' }}
          />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? CHART_COLORS[i]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: palette.tooltipBg }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                         */
/* ------------------------------------------------------------------ */

interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  formatter?: (value: number) => string;
}

export function DonutChart({ data, height = 240, centerLabel, centerValue, formatter }: DonutChartProps) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="92%"
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SVG progress ring                                                   */
/* ------------------------------------------------------------------ */

interface ProgressRingProps {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ value, size = 120, strokeWidth = 10, color = '#2563eb', label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {Math.round(clamped)}
          <span className="text-sm font-bold text-slate-400">%</span>
        </span>
        {label && <span className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
