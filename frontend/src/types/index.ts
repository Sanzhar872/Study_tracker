export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Subject {
  id: number;
  name: string;
  color: string;
}

export interface Topic {
  id: number;
  subject_id: number;
  name: string;
  mastery: number;
}

export interface Entry {
  id: number;
  topic_id: number;
  date: string;
  hours: number;
  description: string | null;
  created_at: string;
}

export interface EntryWithContext extends Entry {
  topic: Topic & { subject: Subject };
}

export type SubjectCreate = Omit<Subject, "id">;
export type SubjectUpdate = Partial<SubjectCreate>;

export type TopicCreate = Omit<Topic, "id" | "mastery"> & { mastery?: number };
export type TopicUpdate = Partial<Omit<Topic, "id">>;

export type EntryCreate = Omit<Entry, "id" | "created_at" | "description">;
export type EntryUpdate = Partial<EntryCreate>;
