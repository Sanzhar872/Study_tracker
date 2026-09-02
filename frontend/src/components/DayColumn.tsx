import type { EntryWithContext } from "../types";
import { formatDayLabel } from "../utils/dates";
import EntryCard from "./EntryCard";

interface Props {
  date: Date;
  dateISO: string;
  isToday: boolean;
  entries: EntryWithContext[];
  loading: boolean;
  onAddClick: () => void;
  onEntryClick: (entry: EntryWithContext) => void;
}

export default function DayColumn({ date, isToday, entries, onAddClick, onEntryClick }: Props) {
  const total = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className={`day-column ${isToday ? "is-today" : ""}`}>
      <div className="day-header">
        <span className="day-header-label">{formatDayLabel(date)}</span>
        <button className="day-add-btn" onClick={onAddClick} title="Добавить запись">
          +
        </button>
      </div>
      <div className="day-cards">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} />
        ))}
      </div>
      {entries.length > 0 && (
        <div className="day-total">
          Итого: <strong>{total.toFixed(1)} ч</strong>
        </div>
      )}
    </div>
  );
}
