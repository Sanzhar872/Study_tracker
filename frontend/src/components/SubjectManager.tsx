import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Subject, Topic } from "../types";
import { masteryTier } from "../utils/mastery";

const DEFAULT_COLOR = "#536878";

export default function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(DEFAULT_COLOR);
  const [newTopicName, setNewTopicName] = useState("");

  function reloadSubjects() {
    api.subjects.list().then((data) => {
      setSubjects(data);
      if (selectedSubjectId === null && data.length > 0) {
        setSelectedSubjectId(data[0].id);
      }
    });
  }

  function reloadTopics() {
    api.topics.list().then(setTopics);
  }

  useEffect(() => {
    reloadSubjects();
    reloadTopics();
  }, []);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const subjectTopics = topics.filter((t) => t.subject_id === selectedSubjectId);

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const created = await api.subjects.create({
      name: newSubjectName.trim(),
      color: newSubjectColor,
    });
    setNewSubjectName("");
    setNewSubjectColor(DEFAULT_COLOR);
    setSubjects((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedSubjectId(created.id);
  }

  async function handleRenameSubject(subject: Subject) {
    const name = window.prompt("Новое название предмета", subject.name);
    if (!name || !name.trim() || name === subject.name) return;
    const updated = await api.subjects.update(subject.id, { name: name.trim() });
    setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function handleDeleteSubject(subject: Subject) {
    if (!window.confirm(`Удалить предмет "${subject.name}" вместе со всеми темами и записями?`)) {
      return;
    }
    await api.subjects.remove(subject.id);
    setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
    setTopics((prev) => prev.filter((t) => t.subject_id !== subject.id));
    if (selectedSubjectId === subject.id) setSelectedSubjectId(null);
  }

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubjectId || !newTopicName.trim()) return;
    const created = await api.topics.create({
      subject_id: selectedSubjectId,
      name: newTopicName.trim(),
    });
    setNewTopicName("");
    setTopics((prev) => [...prev, created]);
  }

  async function handleRenameTopic(topic: Topic) {
    const name = window.prompt("Новое название темы", topic.name);
    if (!name || !name.trim() || name === topic.name) return;
    const updated = await api.topics.update(topic.id, { name: name.trim() });
    setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleDeleteTopic(topic: Topic) {
    if (!window.confirm(`Удалить тему "${topic.name}" вместе со всеми записями?`)) return;
    await api.topics.remove(topic.id);
    setTopics((prev) => prev.filter((t) => t.id !== topic.id));
  }

  function handleMasteryDrag(topicId: number, value: number) {
    setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, mastery: value } : t)));
  }

  async function commitMastery(topicId: number, value: number) {
    await api.topics.update(topicId, { mastery: value });
  }

  return (
    <div className="manage-page">
      <div className="panel">
        <h3>Предметы</h3>
        {subjects.map((s) => (
          <div
            key={s.id}
            className={`subject-row ${s.id === selectedSubjectId ? "selected" : ""}`}
            onClick={() => setSelectedSubjectId(s.id)}
          >
            <span className="color-dot" style={{ background: s.color }} />
            <span className="subject-row-name">{s.name}</span>
            <button
              className="small-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRenameSubject(s);
              }}
            >
              изм.
            </button>
            <button
              className="small-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSubject(s);
              }}
            >
              удал.
            </button>
          </div>
        ))}
        {subjects.length === 0 && <div className="empty-hint">Пока нет предметов</div>}

        <form className="inline-form" onSubmit={handleAddSubject}>
          <input
            type="color"
            value={newSubjectColor}
            onChange={(e) => setNewSubjectColor(e.target.value)}
            title="Цвет предмета"
          />
          <input
            type="text"
            placeholder="Название предмета"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Добавить
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Темы {selectedSubject ? `— ${selectedSubject.name}` : ""}</h3>
        {!selectedSubject && <div className="empty-hint">Выберите предмет слева</div>}
        {selectedSubject && (
          <>
            {subjectTopics.map((t) => {
              const tier = masteryTier(t.mastery);
              return (
                <div key={t.id} className="topic-row">
                  <div className="topic-row-top">
                    <span className="topic-row-name">{t.name}</span>
                    <div>
                      <button className="small-btn" onClick={() => handleRenameTopic(t)}>
                        изм.
                      </button>
                      <button className="small-btn" onClick={() => handleDeleteTopic(t)}>
                        удал.
                      </button>
                    </div>
                  </div>
                  <div className="mastery-row">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={t.mastery}
                      title={tier.label}
                      className="mastery-slider"
                      style={
                        {
                          "--mastery-color": tier.color,
                          background: `linear-gradient(to right, ${tier.color} ${t.mastery}%, var(--border) ${t.mastery}%)`,
                        } as React.CSSProperties
                      }
                      onChange={(e) => handleMasteryDrag(t.id, Number(e.target.value))}
                      onMouseUp={(e) => commitMastery(t.id, Number((e.target as HTMLInputElement).value))}
                      onTouchEnd={(e) => commitMastery(t.id, Number((e.target as HTMLInputElement).value))}
                      onKeyUp={(e) => commitMastery(t.id, Number((e.target as HTMLInputElement).value))}
                    />
                    <span className="mastery-value" style={{ color: tier.color }}>
                      {t.mastery}%
                    </span>
                  </div>
                </div>
              );
            })}
            {subjectTopics.length === 0 && <div className="empty-hint">Пока нет тем</div>}

            <form className="inline-form" onSubmit={handleAddTopic}>
              <input
                type="text"
                placeholder="Название темы"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Добавить
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
