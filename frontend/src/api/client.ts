import type {
  AuthResponse,
  Entry,
  EntryCreate,
  EntryUpdate,
  EntryWithContext,
  Subject,
  SubjectCreate,
  SubjectUpdate,
  Topic,
  TopicCreate,
  TopicUpdate,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`;
const TOKEN_KEY = "study_tracker_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Одна попытка достучаться до бэкенда. Холодный старт на бесплатном хостинге
 * отвечает долго, ошибкой без CORS-заголовков или обрывом — всё это = false.
 */
export async function pingServer(timeoutMs = 10000): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    onUnauthorized?.();
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<AuthResponse["user"]>("/auth/me"),
  },
  subjects: {
    list: () => request<Subject[]>("/subjects"),
    create: (data: SubjectCreate) =>
      request<Subject>("/subjects", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: SubjectUpdate) =>
      request<Subject>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/subjects/${id}`, { method: "DELETE" }),
  },
  topics: {
    list: (subjectId?: number) =>
      request<Topic[]>(subjectId ? `/topics?subject_id=${subjectId}` : "/topics"),
    create: (data: TopicCreate) =>
      request<Topic>("/topics", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: TopicUpdate) =>
      request<Topic>(`/topics/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/topics/${id}`, { method: "DELETE" }),
  },
  entries: {
    listRange: (start: string, end: string) =>
      request<EntryWithContext[]>(`/entries?start=${start}&end=${end}`),
    create: (data: EntryCreate) =>
      request<Entry>("/entries", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: EntryUpdate) =>
      request<Entry>(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/entries/${id}`, { method: "DELETE" }),
  },
};
