import { useEffect, useState } from "react";

const MESSAGES = [
  "Будим сервер…",
  "Разогреваем базу данных…",
  "Раскладываем конспекты по полочкам…",
  "Затачиваем карандаши…",
  "Сверяем расписание на неделю…",
  "Почти готово, наливаем кофе…",
];
const MESSAGE_INTERVAL_MS = 3500;
const LONG_WAIT_SECONDS = 75;

interface Props {
  startedAt: number;
  done: boolean;
}

export default function ServerWakeScreen({ startedAt, done }: Props) {
  const [seconds, setSeconds] = useState(() => Math.floor((Date.now() - startedAt) / 1000));

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [startedAt, done]);

  // Прогресс — не настоящий (мы не знаем, когда проснётся сервер), а плавно замедляющийся к 95%.
  const progress = done ? 100 : Math.round(95 * (1 - Math.exp(-seconds / 25)));
  const message = MESSAGES[Math.floor(seconds / (MESSAGE_INTERVAL_MS / 1000)) % MESSAGES.length];
  const longWait = seconds >= LONG_WAIT_SECONDS;

  return (
    <div className="auth-page wake-page" role="status" aria-live="polite">
      <div className="auth-card wake-card">
        <div className={`wake-scene ${done ? "is-done" : ""}`} aria-hidden="true">
          <div className="wake-glow" />
          <div className="wake-orbit">
            <span className="wake-dot wake-dot-red" />
            <span className="wake-dot wake-dot-lilac" />
            <span className="wake-dot wake-dot-slate" />
          </div>
          <div className="wake-core">
            <svg className="wake-book" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 12c-4-3-10-4-16-3v27c6-1 12 0 16 3 4-3 10-4 16-3V9c-6-1-12 0-16 3z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M24 12v27" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            <svg className="wake-check" viewBox="0 0 48 48" fill="none">
              <path
                d="M13 25l8 8 15-17"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="wake-z wake-z-1">z</span>
          <span className="wake-z wake-z-2">z</span>
          <span className="wake-z wake-z-3">Z</span>
        </div>

        <h1 className="auth-title wake-title">{done ? "Готово!" : "Сервер просыпается"}</h1>
        <p className="wake-message" key={done ? "done" : message}>
          {done ? "Открываем твой дневник…" : message}
        </p>

        <div className="wake-bar" aria-hidden="true">
          <div className="wake-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <p className="wake-hint">
          {longWait && !done
            ? "Что-то долго. Бесплатный хостинг иногда просыпается до пары минут — если ничего не меняется, обнови страницу."
            : "Бесплатный хостинг засыпает без активности. Первая загрузка занимает до минуты — дальше всё будет быстро."}
        </p>
        {!done && <p className="wake-timer">{seconds} с</p>}
      </div>
    </div>
  );
}
