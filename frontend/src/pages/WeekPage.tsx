import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import type { EntryWithContext, Subject, Topic } from "../types";
import { toISODate } from "../utils/dates";
import { usePeriodNav } from "../hooks/usePeriodNav";
import PeriodHeader from "../components/PeriodHeader";
import WeekView from "../components/WeekView";
import AddEntryModal from "../components/AddEntryModal";
import HoursChart from "../components/HoursChart";
import StudyTimer from "../components/StudyTimer";

export default function WeekPage() {
  const nav = usePeriodNav();
  const { weekStart, weekEnd } = nav;
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

  const loadEntries = useCallback(() => {
    setLoading(true);
    api.entries
      .listRange(toISODate(weekStart), toISODate(weekEnd))
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    api.subjects.list().then(setSubjects);
    api.topics.list().then(setTopics);
  }, []);

  function handleTopicCreated(topic: Topic) {
    setTopics((prev) => [...prev, topic]);
  }

  function handleSaved() {
    setModalState(null);
    loadEntries();
    setChartRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <StudyTimer
        subjects={subjects}
        topics={topics}
        onSaved={handleSaved}
        onTopicCreated={handleTopicCreated}
      />

      <PeriodHeader
        title={nav.title}
        isMobile={nav.isMobile}
        onPrev={nav.prev}
        onToday={nav.today}
        onNext={nav.next}
      />

      <WeekView
        days={nav.days}
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
          onTopicCreated={handleTopicCreated}
        />
      )}

      <HoursChart subjects={subjects} refreshKey={chartRefreshKey} />
    </div>
  );
}
