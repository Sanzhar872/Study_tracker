import type { EntryWithContext } from "../types";
import { getWeekDays, toISODate } from "../utils/dates";
import DayColumn from "./DayColumn";

interface Props {
  weekStart: Date;
  entries: EntryWithContext[];
  loading: boolean;
  onAddClick: (date: string) => void;
  onEntryClick: (entry: EntryWithContext) => void;
}

export default function WeekView({ weekStart, entries, loading, onAddClick, onEntryClick }: Props) {
  const days = getWeekDays(weekStart);
  const todayISO = toISODate(new Date());

  return (
    <div className="week-grid">
      {days.map((day) => {
        const dayISO = toISODate(day);
        const dayEntries = entries.filter((e) => e.date === dayISO);
        return (
          <DayColumn
            key={dayISO}
            date={day}
            dateISO={dayISO}
            isToday={dayISO === todayISO}
            entries={dayEntries}
            loading={loading}
            onAddClick={() => onAddClick(dayISO)}
            onEntryClick={onEntryClick}
          />
        );
      })}
    </div>
  );
}
