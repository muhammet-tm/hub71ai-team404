// Browser only. Profile, plan, checklist, and chat live on the device. Document images are never stored.
import type { ChatTurn, PlanResult, Profile } from "./types";

const KEYS = {
  consent: "dalil.consent",
  profile: "dalil.profile",
  plan: "dalil.plan",
  done: "dalil.done",
  chat: "dalil.chat",
} as const;

function read<T>(key: string): T | null {
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be unavailable (private window); the app still works for this session */
  }
}

export const store = {
  getConsent: () => read<{ accepted: boolean; at: string; version: number }>(KEYS.consent),
  setConsent: () => write(KEYS.consent, { accepted: true, at: new Date().toISOString(), version: 1 }),
  getProfile: () => read<Profile>(KEYS.profile),
  setProfile: (p: Profile) => write(KEYS.profile, p),
  getPlan: () => read<PlanResult>(KEYS.plan),
  setPlan: (p: PlanResult) => write(KEYS.plan, p),
  clearPlan: () => {
    try {
      window.localStorage.removeItem(KEYS.plan);
    } catch {}
  },
  getDone: () => read<Record<string, boolean>>(KEYS.done) || {},
  setDone: (d: Record<string, boolean>) => write(KEYS.done, d),
  getChat: () => read<ChatTurn[]>(KEYS.chat) || [],
  setChat: (c: ChatTurn[]) => write(KEYS.chat, c.slice(-20)),
  deleteAll: () => {
    try {
      Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch {}
  },
};
