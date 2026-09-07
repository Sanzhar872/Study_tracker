import { useState } from "react";
import { api } from "../api/client";
import type { EntryWithContext, Subject, Topic } from "../types";

type ModalState =
  | { mode: "create"; date: string }
  | { mode: "edit"; entry: EntryWithContext };

interface Props {
  state: ModalState;
  subjects: Subject[];
  topics: Topic[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AddEntryModal({ state, subjects, topics, onClose, onSaved }: Props) {
  const isEdit = state.mode === "edit";
  const initialEntry = isEdit ? state.entry : null;

  const [subjectId, setSubjectId] = useState<number | "">(
    initialEntry?.topic.subject_id ?? ""
  );
  const [topicId, setTopicId] = useState<number | "">(initialEntry?.topic_id ?? "");
  const initialWholeHours = initialEntry ? Math.floor(initialEntry.hours) : null;
  const [hoursPart, setHoursPart] = useState<string>(
    initialWholeHours !== null ? String(initialWholeHours) : ""
  );
  const [minutesPart, setMinutesPart] = useState<string>(
    initialEntry
      ? String(Math.round((initialEntry.hours - initialWholeHours!) * 60))
      : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredTopics = topics.filter((t) => t.subject_id === subjectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const h = hoursPart.trim() === "" ? 0 : parseInt(hoursPart, 10);
    const m = minutesPart.trim() === "" ? 0 : parseInt(minutesPart, 10);
    if (!topicId) {
      setError("Выберите тему");
      return;
    }
    if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || m < 0 || m > 59) {
      setError("Укажите корректные часы и минуты (минуты от 0 до 59)");
      return;
    }
    const hoursNum = h + m / 60;
    if (hoursNum <= 0 || hoursNum > 24) {
      setError("Время должно быть больше 0 и не больше 24 часов");
      return;
    }
    setSaving(true);
    try {
      if (state.mode === "create") {
        await api.entries.create({
          topic_id: topicId as number,
          date: state.date,
          hours: hoursNum,
        });
      } else {
        await api.entries.update(state.entry.id, {
          topic_id: topicId as number,
          hours: hoursNum,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (state.mode !== "edit") return;
    setSaving(true);
    try {
      await api.entries.remove(state.entry.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? "Редактировать запись" : "Новая запись"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Предмет</label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value ? Number(e.target.value) : "");
                setTopicId("");
              }}
              required
            >
              <option value="" disabled>
                Выберите предмет
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Тема</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}
              required
              disabled={!subjectId}
            >
              <option value="" disabled>
                {subjectId ? "Выберите тему" : "Сначала выберите предмет"}
              </option>
              {filteredTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Время</label>
            <div className="time-input-row">
              <div className="time-input-group">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="24"
                  placeholder="0"
                  value={hoursPart}
                  onChange={(e) => setHoursPart(e.target.value)}
                />
                <span className="time-input-unit">ч</span>
              </div>
              <div className="time-input-group">
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={minutesPart}
                  onChange={(e) => setMinutesPart(e.target.value)}
                />
                <span className="time-input-unit">мин</span>
              </div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <div>
              {isEdit && (
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  Удалить
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn" onClick={onClose} disabled={saving}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
