import { useState } from "react";
import { api, setToken } from "../api/client";
import type { User } from "../types";

interface Props {
  onAuthenticated: (user: User) => void;
}

export default function AuthPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Заполните email и пароль");
      return;
    }
    if (mode === "register" && password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }

    setSaving(true);
    try {
      const res =
        mode === "login"
          ? await api.auth.login(email.trim(), password)
          : await api.auth.register(email.trim(), password);
      setToken(res.access_token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? mode === "login"
            ? "Неверный email или пароль"
            : err.message.includes("400")
              ? "Такой email уже зарегистрирован"
              : err.message
          : "Ошибка"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Study Tracker</h1>
        <p className="auth-subtitle">
          {mode === "login" ? "Войдите, чтобы увидеть свой график" : "Создайте аккаунт"}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
            />
          </div>

          <div className="form-field">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Не короче 6 символов" : "Пароль"}
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={saving}>
            {saving ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError(null);
          }}
        >
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </div>
  );
}
