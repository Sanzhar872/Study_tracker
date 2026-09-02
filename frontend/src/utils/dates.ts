export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Monday-start week containing the given date.
export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${weekStart.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} — ${weekEnd.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`;
}
