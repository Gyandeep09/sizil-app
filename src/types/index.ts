export type ProjectStatus =
  | "ACTIVE"
  | "PAUSED"
  | "ARCHIVED"
  | "COMPLETED"
  | "DELETED";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface User {
  id: string;
  username: string;
  avatarPath: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  path: string;
  primaryLanguage: string;

  techStack: string[];
  status: ProjectStatus;
  lastModified: string | null;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string | null;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
}

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  createdAt: string;
}
