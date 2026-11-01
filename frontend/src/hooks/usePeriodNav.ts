import { useMemo, useState } from "react";
import { addDays, formatFullDay, formatWeekRange, getWeekDays, startOfWeek, toISODate } from "../utils/dates";
import { useIsMobile } from "./useIsMobile";

/**
 * Навигация по периоду: на десктопе — по неделям, на мобиле — по одному дню
 * (по умолчанию сегодняшнему). Данные всё равно грузятся за всю неделю.
 */
export function usePeriodNav() {
  const isMobile = useIsMobile();
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const weekStartISO = toISODate(startOfWeek(selectedDay));
  const weekStart = useMemo(() => new Date(`${weekStartISO}T00:00:00`), [weekStartISO]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const step = isMobile ? 1 : 7;
  const days = isMobile ? [selectedDay] : getWeekDays(weekStart);
  const title = isMobile ? formatFullDay(selectedDay) : formatWeekRange(weekStart);

  return {
    isMobile,
    weekStart,
    weekEnd,
    days,
    title,
    prev: () => setSelectedDay((d) => addDays(d, -step)),
    next: () => setSelectedDay((d) => addDays(d, step)),
    today: () => setSelectedDay(startOfDay(new Date())),
  };
}

function startOfDay(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}
