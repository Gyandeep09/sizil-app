import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Project, ProjectStatus, Task } from "../types";

export type ProjectView = "active" | "completed" | "archived" | "deleted";

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
  isDbReady: boolean;
  error: string | null;
  view: ProjectView;

  tasksByProject: Record<string, Task[]>;

  setView: (view: ProjectView) => void;
  initializeDb: () => Promise<void>;
  fetchProjects: (userId: string) => Promise<void>;
  addProject: (userId: string, path: string) => Promise<Project | null>;
  scanDirectory: (userId: string, parentPath: string) => Promise<Project[]>;
  updateStatus: (id: string, status: ProjectStatus) => Promise<boolean>;
  permanentlyDelete: (id: string) => Promise<boolean>;
  launchTool: (
    tool: "vscode" | "neovim" | "terminal" | "explorer",
    path: string
  ) => Promise<boolean>;

  fetchTasks: (projectId: string) => Promise<void>;
  addTask: (projectId: string, title: string) => Promise<void>;
  toggleTask: (projectId: string, taskId: string) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  isLoading: false,
  isDbReady: false,
  error: null,
  view: "active",
  tasksByProject: {},

  setView: (view) => set({ view }),

  initializeDb: async () => {
    try {
      await invoke<string>("initialize_db");
      set({ isDbReady: true, error: null });
    } catch (err) {
      set({ isDbReady: false, error: String(err) });
    }
  },

  fetchProjects: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await invoke<Project[]>("get_projects", { userId });
      set({ projects, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: String(err) });
    }
  },

  addProject: async (userId, path) => {
    set({ error: null });
    try {
      const project = await invoke<Project>("add_project", { userId, path });
      set((state) => ({ projects: [project, ...state.projects] }));
      return project;
    } catch (err) {
      set({ error: String(err) });
      return null;
    }
  },

  scanDirectory: async (userId, parentPath) => {
    set({ error: null, isLoading: true });
    try {
      const found = await invoke<Project[]>("scan_directory", {
        userId,
        parentPath,
      });
      set((state) => {
        const existingIds = new Set(state.projects.map((p) => p.id));
        const newOnes = found.filter((p) => !existingIds.has(p.id));
        return { projects: [...newOnes, ...state.projects], isLoading: false };
      });
      return found;
    } catch (err) {
      set({ error: String(err), isLoading: false });
      return [];
    }
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await invoke<Project>("update_project_status", {
        id,
        status,
      });
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
      return true;
    } catch (err) {
      set({ error: String(err) });
      return false;
    }
  },

  permanentlyDelete: async (id) => {
    try {
      await invoke<void>("permanently_delete_project", { id });
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
      return true;
    } catch (err) {
      set({ error: String(err) });
      return false;
    }
  },

  launchTool: async (tool, path) => {
    try {
      await invoke<void>("launch_tool", { tool, path });
      return true;
    } catch (err) {
      set({ error: String(err) });
      return false;
    }
  },

  fetchTasks: async (projectId) => {
    try {
      const tasks = await invoke<Task[]>("get_tasks", { projectId });
      set((state) => ({
        tasksByProject: { ...state.tasksByProject, [projectId]: tasks },
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  addTask: async (projectId, title) => {
    try {
      const task = await invoke<Task>("add_task", { projectId, title });
      set((state) => ({
        tasksByProject: {
          ...state.tasksByProject,
          [projectId]: [...(state.tasksByProject[projectId] ?? []), task],
        },
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  toggleTask: async (projectId, taskId) => {
    try {
      const updated = await invoke<Task>("toggle_task", { id: taskId });
      set((state) => ({
        tasksByProject: {
          ...state.tasksByProject,
          [projectId]: (state.tasksByProject[projectId] ?? []).map((t) =>
            t.id === taskId ? updated : t
          ),
        },
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteTask: async (projectId, taskId) => {
    try {
      await invoke<void>("delete_task", { id: taskId });
      set((state) => ({
        tasksByProject: {
          ...state.tasksByProject,
          [projectId]: (state.tasksByProject[projectId] ?? []).filter(
            (t) => t.id !== taskId
          ),
        },
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },
}));
