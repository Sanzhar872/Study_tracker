import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Task } from "../types";
import { toISODate } from "../utils/dates";
import { usePeriodNav } from "../hooks/usePeriodNav";
import PeriodHeader from "../components/PeriodHeader";
import PlannerDay from "../components/PlannerDay";

export default function PlannerPage() {
  const nav = usePeriodNav();
  const { weekStart, weekEnd } = nav;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.tasks
      .listRange(toISODate(weekStart), toISODate(weekEnd))
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить дела");
      });
    return () => {
      cancelled = true;
    };
  }, [weekStart, weekEnd]);

  async function handleAdd(date: string, text: string) {
    setError(null);
    try {
      const task = await api.tasks.create({ date, text });
      setTasks((prev) => [...prev, task]);
    } catch (e) {
      setError("Не удалось добавить дело");
      throw e;
    }
  }

  function handleToggle(task: Task) {
    const done = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done } : t)));
    api.tasks.update(task.id, { done }).catch(() => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)));
      setError("Не удалось сохранить изменение");
    });
  }

  function handleDelete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    api.tasks.remove(task.id).catch(() => {
      setTasks((prev) => [...prev, task].sort((a, b) => a.id - b.id));
      setError("Не удалось удалить дело");
    });
  }

  const todayISO = toISODate(new Date());

  return (
    <div>
      <PeriodHeader
        title={nav.title}
        isMobile={nav.isMobile}
        onPrev={nav.prev}
        onToday={nav.today}
        onNext={nav.next}
      />

      {error && <div className="form-error">{error}</div>}

      <div className={`week-grid ${nav.days.length === 1 ? "week-grid--single" : ""}`}>
        {nav.days.map((day) => {
          const dayISO = toISODate(day);
          return (
            <PlannerDay
              key={dayISO}
              date={day}
              isToday={dayISO === todayISO}
              tasks={tasks.filter((t) => t.date === dayISO)}
              onAdd={(text) => handleAdd(dayISO, text)}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
