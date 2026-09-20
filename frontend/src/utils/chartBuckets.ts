import { addDays, startOfWeek, toISODate } from "./dates";
import type { EntryWithContext } from "../types";

export type Granularity = "day" | "week" | "month";

export interface Bucket {
  key: string;
  label: string;
  fullLabel: string;
  start: Date;
  end: Date;
}

export const BUCKET_COUNT: Record<Granularity, number> = {
  day: 7,
  week: 5,
  month: 6,
};

export const GRANULARITY_LABELS: Record<Granularity, string> = {
  day: "По дням",
  week: "По неделям",
  month: "По месяцу",
};

export const EMPTY_PERIOD_LABELS: Record<Granularity, string> = {
  day: "за последние 7 дней",
  week: "за последние 5 недель",
  month: "за последние 6 месяцев",
};

function startOfDay(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getBuckets(granularity: Granularity, today: Date = new Date()): Bucket[] {
  const count = BUCKET_COUNT[granularity];

  if (granularity === "day") {
    const end = startOfDay(today);
    return Array.from({ length: count }, (_, i) => {
      const d = addDays(end, -(count - 1 - i));
      return {
        key: toISODate(d),
        label: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
        fullLabel: d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" }),
        start: d,
        end: d,
      };
    });
  }

  if (granularity === "week") {
    const currentWeekStart = startOfWeek(today);
    return Array.from({ length: count }, (_, i) => {
      const start = addDays(currentWeekStart, -(count - 1 - i) * 7);
      const end = addDays(start, 6);
      return {
        key: toISODate(start),
        label: start.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" }),
        fullLabel: `${start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`,
        start,
        end,
      };
    });
  }

  const anchor = new Date(today.getFullYear(), today.getMonth(), 1);
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() - (count - 1 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return {
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("ru-RU", { month: "short" }),
      fullLabel: start.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }),
      start,
      end,
    };
  });
}

export function bucketRange(buckets: Bucket[]): { startISO: string; endISO: string } {
  return {
    startISO: toISODate(buckets[0].start),
    endISO: toISODate(buckets[buckets.length - 1].end),
  };
}

export function aggregateBySubject(
  entries: EntryWithContext[],
  buckets: Bucket[],
  subjectIds: number[]
): Record<number, number[]> {
  const result: Record<number, number[]> = {};
  for (const id of subjectIds) result[id] = buckets.map(() => 0);

  for (const entry of entries) {
    const subjectId = entry.topic.subject.id;
    if (!(subjectId in result)) continue;
    const entryDate = new Date(`${entry.date}T00:00:00`);
    const idx = buckets.findIndex((b) => entryDate >= b.start && entryDate <= b.end);
    if (idx === -1) continue;
    result[subjectId][idx] += entry.hours;
  }

  return result;
}

export function aggregateTotal(entries: EntryWithContext[], buckets: Bucket[]): number[] {
  const result = buckets.map(() => 0);

  for (const entry of entries) {
    const entryDate = new Date(`${entry.date}T00:00:00`);
    const idx = buckets.findIndex((b) => entryDate >= b.start && entryDate <= b.end);
    if (idx === -1) continue;
    result[idx] += entry.hours;
  }

  return result;
}

// Базовый максимум оси Y (в часах). 0 = без базы: шкала подстраивается под данные.
export const Y_BASE_MAX: Record<Granularity, number> = {
  day: 4,
  week: 20,
  month: 0,
};

// На оси Y месяцев числа не показываем — только линии сетки.
export const SHOW_Y_LABELS: Record<Granularity, boolean> = {
  day: true,
  week: true,
  month: false,
};

const BASE_TICK_INTERVALS = 4;
const MAX_Y_TICKS = 5;
const Y_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

export interface YScale {
  max: number;
  ticks: number[];
}

// Ось Y фиксирована на baseMax (4 ч для дней, 20 ч для недель) и расширяется только
// если значение реально больше, чтобы столбик не обрезался.
export function getYScale(maxValue: number, baseMax: number): YScale {
  if (baseMax > 0 && maxValue <= baseMax) {
    const step = baseMax / BASE_TICK_INTERVALS;
    return {
      max: baseMax,
      ticks: Array.from({ length: BASE_TICK_INTERVALS + 1 }, (_, i) => i * step),
    };
  }
  const top = Math.max(maxValue, 1);
  const step =
    Y_STEPS.find((s) => Math.ceil(top / s) <= MAX_Y_TICKS) ?? Y_STEPS[Y_STEPS.length - 1];
  const count = Math.ceil(top / step);
  return {
    max: count * step,
    ticks: Array.from({ length: count + 1 }, (_, i) => i * step),
  };
}

export function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
