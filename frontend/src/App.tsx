import { useEffect, useState } from "react";
import WeekPage from "./pages/WeekPage";
import ManagePage from "./pages/ManagePage";
import AuthPage from "./pages/AuthPage";
import { api, clearToken, getToken, setUnauthorizedHandler } from "./api/client";
import type { User } from "./types";

type Page = "week" | "manage";

export default function App() {
  const [page, setPage] = useState<Page>("week");
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setCheckingSession(false);
      return;
    }
    api.auth
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setCheckingSession(false));
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
  }

  if (checkingSession) {
    return null;
  }

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />;
  }

  return (
    <div className="app">
      <nav className="nav">
        <button
          className={`nav-btn ${page === "week" ? "active" : ""}`}
          onClick={() => setPage("week")}
        >
          Неделя
        </button>
        <button
          className={`nav-btn ${page === "manage" ? "active" : ""}`}
          onClick={() => setPage("manage")}
        >
          Предметы и темы
        </button>
        <div className="nav-spacer" />
        <span className="nav-user">{user.email}</span>
        <button className="nav-btn" onClick={handleLogout}>
          Выйти
        </button>
      </nav>
      {page === "week" ? <WeekPage /> : <ManagePage />}
    </div>
  );
}
