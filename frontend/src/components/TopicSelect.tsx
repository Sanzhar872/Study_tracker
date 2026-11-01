import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { Topic } from "../types";

// Темы, созданные прямо из записи или таймера, стартуют с этого уровня освоения.
const NEW_TOPIC_MASTERY = 25;
const NEW_OPTION = "__new__";

interface Props {
  subjectId: number | "";
  topics: Topic[];
  value: number | "";
  onChange: (topicId: number | "") => void;
  onTopicCreated: (topic: Topic) => void;
  placeholder: string;
  disabledPlaceholder: string;
  required?: boolean;
}

/** Выбор темы с возможностью создать новую тему у выбранного предмета прямо на месте. */
export default function TopicSelect({
  subjectId,
  topics,
  value,
  onChange,
  onTopicCreated,
  placeholder,
  disabledPlaceholder,
  required,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTopics = topics.filter((t) => t.subject_id === subjectId);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  // Сменили предмет — недописанная тема больше не относится к нему.
  useEffect(() => {
    cancel();
  }, [subjectId]);

  function cancel() {
    setCreating(false);
    setName("");
    setError(null);
  }

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || !subjectId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const topic = await api.topics.create({
        subject_id: subjectId,
        name: trimmed,
        mastery: NEW_TOPIC_MASTERY,
      });
      onTopicCreated(topic);
      onChange(topic.id);
      cancel();
    } catch {
      setError("Не удалось создать тему");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // внутри формы Enter иначе отправит всю запись
      e.preventDefault();
      create();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    }
  }

  if (creating) {
    return (
      <div className="topic-create">
        <div className="topic-create-row">
          <input
            ref={inputRef}
            type="text"
            placeholder="Название новой темы"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
          />
          <button
            type="button"
            className="topic-create-btn is-ok"
            onClick={create}
            disabled={!name.trim() || saving}
            title="Создать тему"
          >
            ✓
          </button>
          <button
            type="button"
            className="topic-create-btn"
            onClick={cancel}
            disabled={saving}
            title="Отмена"
          >
            ✕
          </button>
        </div>
        {error && <div className="form-error topic-create-error">{error}</div>}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === NEW_OPTION) {
          setCreating(true);
          return;
        }
        onChange(e.target.value ? Number(e.target.value) : "");
      }}
      required={required}
      disabled={!subjectId}
    >
      <option value="" disabled>
        {subjectId ? placeholder : disabledPlaceholder}
      </option>
      {filteredTopics.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
      <option value={NEW_OPTION}>+ Новая тема…</option>
    </select>
  );
}
