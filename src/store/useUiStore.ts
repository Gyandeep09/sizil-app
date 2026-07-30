import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface UiStore {
  toasts: Toast[];
  soundEnabled: boolean;
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
  toggleSound: () => void;
}

const SOUND_PREF_KEY = "sizil:sound-enabled";
const TOAST_LIFETIME_MS = 4000;

function readSoundPref(): boolean {
  try {
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored === null ? true : stored === "true";
  } catch {

    return true;
  }
}

export const useUiStore = create<UiStore>((set, get) => ({
  toasts: [],
  soundEnabled: readSoundPref(),

  pushToast: (message, tone = "info") => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), TOAST_LIFETIME_MS);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  toggleSound: () => {
    set((state) => {
      const next = !state.soundEnabled;
      try {
        localStorage.setItem(SOUND_PREF_KEY, String(next));
      } catch {

      }
      return { soundEnabled: next };
    });
  },
}));
