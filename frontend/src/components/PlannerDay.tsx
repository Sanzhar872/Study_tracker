import { useEffect, useRef, useState } from "react";
import type { Task } from "../types";
import { formatDayLabel } from "../utils/dates";

interface Props {
  date: Date;
  isToday: boolean;
  tasks: Task[];
  onAdd: (text: string) => Promise<void>;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function PlannerDay({ date, isToday, tasks, onAdd, onToggle, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const doneCount = tasks.filter((t) => t.done).length;

  function close() {
    setAdding(false);
    setText("");
  }

  async function submit() {
    const value = text.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      await onAdd(value);
      setText("");
      inputRef.current?.focus();
    } catch {
      // ошибку показывает страница, текст оставляем, чтобы не потерять
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <div className={`day-column ${isToday ? "is-today" : ""}`}>
      <div className="day-header">
        <span className="day-header-label">{formatDayLabel(date)}</span>
        <button
          className="day-add-btn"
          onClick={() => (adding ? close() : setAdding(true))}
          title="Добавить дело"
        >
          +
        </button>
      </div>

      {adding && (
        <div className="task-add">
          <textarea
            ref={inputRef}
            className="task-add-input"
            placeholder="Что нужно сделать?"
            value={text}
            rows={2}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="task-add-actions">
            <button className="btn" onClick={close}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={!text.trim() || saving}>
              Добавить
            </button>
          </div>
        </div>
      )}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={`task-item ${task.done ? "is-done" : ""}`}>
            <label className="task-check">
              <input type="checkbox" checked={task.done} onChange={() => onToggle(task)} />
              <span className="task-text">{task.text}</span>
            </label>
            <button className="task-delete" onClick={() => onDelete(task)} title="Удалить">
              ×
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && !adding && <div className="task-empty">Нет дел</div>}

      {tasks.length > 0 && (
        <div className="day-total">
          Выполнено: <strong>{doneCount} / {tasks.length}</strong>
        </div>
      )}
    </div>
  );
}
