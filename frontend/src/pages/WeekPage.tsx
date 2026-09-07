import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import type { EntryWithContext, Subject, Topic } from "../types";
import { addDays, startOfWeek, toISODate, formatWeekRange } from "../utils/dates";
import WeekView from "../components/WeekView";
import AddEntryModal from "../components/AddEntryModal";
import HoursChart from "../components/HoursChart";
import StudyTimer from "../components/StudyTimer";

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [entries, setEntries] = useState<EntryWithContext[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);
  const [modalState, setModalState] = useState<
    | { mode: "create"; date: string }
    | { mode: "edit"; entry: EntryWithContext }
    | null
  >(null);

  const weekEnd = addDays(weekStart, 6);

  const loadEntries = useCallback(() => {
    setLoading(true);
    api.entries
      .listRange(toISODate(weekStart), toISODate(weekEnd))
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    api.subjects.list().then(setSubjects);
    api.topics.list().then(setTopics);
  }, []);

  function handleSaved() {
    setModalState(null);
    loadEntries();
    setChartRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <StudyTimer subjects={subjects} topics={topics} onSaved={handleSaved} />

      <div className="week-header">
        <h2>{formatWeekRange(weekStart)}</h2>
        <div className="week-nav-btns">
          <button className="icon-btn" onClick={() => setWeekStart((d) => addDays(d, -7))}>
            ←
          </button>
          <button className="icon-btn" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            •
          </button>
          <button className="icon-btn" onClick={() => setWeekStart((d) => addDays(d, 7))}>
            →
          </button>
        </div>
      </div>

      <WeekView
        weekStart={weekStart}
        entries={entries}
        loading={loading}
        onAddClick={(date) => setModalState({ mode: "create", date })}
        onEntryClick={(entry) => setModalState({ mode: "edit", entry })}
      />

      {modalState && (
        <AddEntryModal
          state={modalState}
          subjects={subjects}
          topics={topics}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}

      <HoursChart subjects={subjects} refreshKey={chartRefreshKey} />
    </div>
  );
}
