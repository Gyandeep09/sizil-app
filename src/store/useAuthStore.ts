import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { User } from "../types";

const SESSION_KEY = "sizil:session-user-id";

export const PRESET_AVATARS = [
  "ava1", "ava2", "ava3", "ava4", "ava5", "ava6",
] as const;

export type PresetAvatar = (typeof PRESET_AVATARS)[number];

interface AuthStore {
  currentUser: User | null;
  isRestoring: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  signUp: (username: string, password: string) => Promise<boolean>;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;

  selectPresetAvatar: (slug: PresetAvatar) => Promise<boolean>;
}

function rememberSession(userId: string) {
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch {

  }
}

function forgetSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {

  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  isRestoring: true,
  error: null,

  restoreSession: async () => {
    let rememberedId: string | null = null;
    try {
      rememberedId = localStorage.getItem(SESSION_KEY);
    } catch {
      rememberedId = null;
    }
    if (!rememberedId) {
      set({ isRestoring: false });
      return;
    }
    try {
      const user = await invoke<User>("get_user", { userId: rememberedId });
      set({ currentUser: user, isRestoring: false });
    } catch {
      forgetSession();
      set({ isRestoring: false });
    }
  },

  signUp: async (username, password) => {
    set({ error: null });
    try {
      const user = await invoke<User>("sign_up", { username, password });
      rememberSession(user.id);
      set({ currentUser: user });
      return true;
    } catch (err) {
      set({ error: String(err) });
      return false;
    }
  },

  signIn: async (username, password) => {
    set({ error: null });
    try {
      const user = await invoke<User>("sign_in", { username, password });
      rememberSession(user.id);
      set({ currentUser: user });
      return true;
    } catch (err) {
      set({ error: String(err) });
      return false;
    }
  },

  signOut: () => {
    forgetSession();
    set({ currentUser: null });
  },

  selectPresetAvatar: async (slug) => {
    const user = get().currentUser;
    if (!user) return false;
    try {
      const updated = await invoke<User>("set_preset_avatar", {
        userId: user.id,
        slug,
      });
      set({ currentUser: updated });
      return true;
    } catch (err) {
      set({ error: String(err) });
      return false;
    }
  },
}));
