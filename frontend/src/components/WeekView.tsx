import type { EntryWithContext } from "../types";
import { toISODate } from "../utils/dates";
import DayColumn from "./DayColumn";

interface Props {
  days: Date[];
  entries: EntryWithContext[];
  loading: boolean;
  onAddClick: (date: string) => void;
  onEntryClick: (entry: EntryWithContext) => void;
}

export default function WeekView({ days, entries, loading, onAddClick, onEntryClick }: Props) {
  const todayISO = toISODate(new Date());

  return (
    <div className={`week-grid ${days.length === 1 ? "week-grid--single" : ""}`}>
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
