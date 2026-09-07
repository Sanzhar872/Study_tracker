import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Subject, Topic } from "../types";
import { formatElapsed } from "../utils/duration";
import { toISODate } from "../utils/dates";

const STORAGE_KEY = "study_tracker_timer";

type Status = "running" | "paused";

interface StoredTimer {
  subjectId: number;
  topicId: number;
  accumulatedMs: number;
  segmentStartedAt: number | null;
  status: Status;
}

function readStoredTimer(): StoredTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.subjectId === "number" &&
      typeof parsed.topicId === "number" &&
      typeof parsed.accumulatedMs === "number" &&
      (parsed.segmentStartedAt === null || typeof parsed.segmentStartedAt === "number") &&
      (parsed.status === "running" || parsed.status === "paused")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredTimer(timer: StoredTimer | null) {
  try {
    if (timer) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable — timer just won't survive a reload
  }
}

interface Props {
  subjects: Subject[];
  topics: Topic[];
  onSaved: () => void;
}

export default function StudyTimer({ subjects, topics, onSaved }: Props) {
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [status, setStatus] = useState<Status | "idle">("idle");
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [segmentStartedAt, setSegmentStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = readStoredTimer();
    if (stored) {
      setSubjectId(stored.subjectId);
      setTopicId(stored.topicId);
      setAccumulatedMs(stored.accumulatedMs);
      setSegmentStartedAt(stored.segmentStartedAt);
      setStatus(stored.status);
    }
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  const filteredTopics = topics.filter((t) => t.subject_id === subjectId);
  const running = status === "running";
  const paused = status === "paused";
  const active = running || paused;
  const elapsedMs = accumulatedMs + (running && segmentStartedAt ? now - segmentStartedAt : 0);

  const runningSubject = subjects.find((s) => s.id === subjectId);
  const runningTopic = topics.find((t) => t.id === topicId);

  function handleStart() {
    setError(null);
    if (!subjectId || !topicId) {
      setError("Выберите предмет и тему");
      return;
    }
    const ts = Date.now();
    setStatus("running");
    setAccumulatedMs(0);
    setSegmentStartedAt(ts);
    setNow(ts);
    writeStoredTimer({ subjectId, topicId, accumulatedMs: 0, segmentStartedAt: ts, status: "running" });
  }

  function handlePause() {
    if (!running || !subjectId || !topicId) return;
    const ts = Date.now();
    const newAccumulated = accumulatedMs + (segmentStartedAt ? ts - segmentStartedAt : 0);
    setAccumulatedMs(newAccumulated);
    setSegmentStartedAt(null);
    setStatus("paused");
    writeStoredTimer({
      subjectId,
      topicId,
      accumulatedMs: newAccumulated,
      segmentStartedAt: null,
      status: "paused",
    });
  }

  function handleResume() {
    if (!paused || !subjectId || !topicId) return;
    const ts = Date.now();
    setSegmentStartedAt(ts);
    setStatus("running");
    setNow(ts);
    writeStoredTimer({
      subjectId,
      topicId,
      accumulatedMs,
      segmentStartedAt: ts,
      status: "running",
    });
  }

  function handleCancel() {
    setStatus("idle");
    setAccumulatedMs(0);
    setSegmentStartedAt(null);
    writeStoredTimer(null);
    setError(null);
  }

  async function handleStop() {
    if (!active || !topicId) return;
    const finalMs = accumulatedMs + (running && segmentStartedAt ? Date.now() - segmentStartedAt : 0);
    const minutes = Math.round(finalMs / 60000);
    if (minutes < 1) {
      handleCancel();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.entries.create({
        topic_id: topicId as number,
        date: toISODate(new Date()),
        hours: Math.min(24, minutes / 60),
      });
      handleCancel();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`timer-card ${running ? "is-running" : ""} ${paused ? "is-paused" : ""}`}>
      {!active ? (
        <>
          <div className="timer-selects">
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value ? Number(e.target.value) : "");
                setTopicId("");
              }}
            >
              <option value="" disabled>
                Предмет
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}
              disabled={!subjectId}
            >
              <option value="" disabled>
                {subjectId ? "Тема" : "Сначала предмет"}
              </option>
              {filteredTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary timer-start-btn" onClick={handleStart}>
            ▶ Старт
          </button>
        </>
      ) : (
        <>
          <div className="timer-info">
            <span className={`timer-dot ${paused ? "is-paused" : ""}`} />
            <span className="timer-label">
              {runningSubject?.name} — {runningTopic?.name}
              {paused && <span className="timer-paused-badge"> · на паузе</span>}
            </span>
            <span className="timer-clock">{formatElapsed(elapsedMs)}</span>
          </div>
          <div className="timer-actions">
            <button className="btn btn-danger" onClick={handleCancel} disabled={saving}>
              Отменить
            </button>
            {running ? (
              <button className="btn" onClick={handlePause} disabled={saving}>
                ⏸ Пауза
              </button>
            ) : (
              <button className="btn" onClick={handleResume} disabled={saving}>
                ▶ Продолжить
              </button>
            )}
            <button className="btn btn-primary" onClick={handleStop} disabled={saving}>
              ⏹ Стоп
            </button>
          </div>
        </>
      )}
      {error && <div className="form-error timer-error">{error}</div>}
    </div>
  );
}
