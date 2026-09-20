import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { pingServer } from "../api/client";
import ServerWakeScreen from "./ServerWakeScreen";

// Не показываем экран, если сервер ответил почти сразу — иначе он мигнёт на долю секунды.
const SHOW_AFTER_MS = 1200;
const RETRY_DELAY_MS = 2000;
const DONE_HOLD_MS = 900;

type Phase = "checking" | "waking" | "done" | "ready";

interface Props {
  children: ReactNode;
}

export default function ServerGate({ children }: Props) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    let wakingShown = false;
    const slowTimer = window.setTimeout(() => {
      wakingShown = true;
      setPhase("waking");
    }, SHOW_AFTER_MS);
    timers.push(slowTimer);

    (async () => {
      while (!cancelled) {
        if (await pingServer()) break;
        await new Promise<void>((resolve) => {
          timers.push(window.setTimeout(resolve, RETRY_DELAY_MS));
        });
      }
      if (cancelled) return;
      window.clearTimeout(slowTimer);
      // Если экран уже виден — даём увидеть «Готово!», иначе сразу пускаем в приложение.
      if (wakingShown) {
        setPhase("done");
        timers.push(window.setTimeout(() => setPhase("ready"), DONE_HOLD_MS));
      } else {
        setPhase("ready");
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (phase === "ready") return <>{children}</>;
  if (phase === "checking") return null;
  return <ServerWakeScreen startedAt={startedAt} done={phase === "done"} />;
}
