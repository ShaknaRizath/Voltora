// Shared, lightweight polling of the signed-in user's notifications (and, for admins,
// the numbers that need attention). One timer serves every component that uses it.
import { useSyncExternalStore } from "react";
import axios from "axios";
import { API_URL, authHeader, getRole } from "../config";

const EMPTY = { unread: 0, items: [], pendingRepairs: 0, toDeliver: 0 };
const POLL_MS = 30000;

let state = EMPTY;
let timer = null;
const listeners = new Set();

const set = (next) => {
  state = next;
  listeners.forEach((l) => l());
};

export const refreshBadges = async () => {
  if (!localStorage.getItem("token")) {
    if (state !== EMPTY) set(EMPTY);
    return;
  }
  try {
    const headers = authHeader();
    const isAdmin = getRole() === "admin";
    const [notes, counts] = await Promise.all([
      axios.get(`${API_URL}/api/notifications`, { headers }),
      isAdmin ? axios.get(`${API_URL}/api/admin/counts`, { headers }) : Promise.resolve({ data: {} }),
    ]);
    set({
      unread: notes.data.unread || 0,
      items: notes.data.items || [],
      pendingRepairs: counts.data.pendingRepairs || 0,
      toDeliver: counts.data.toDeliver || 0,
    });
  } catch {
    /* offline or signed out: keep the last known numbers */
  }
};

const onVisible = () => document.visibilityState === "visible" && refreshBadges();

const start = () => {
  refreshBadges();
  timer = setInterval(() => document.visibilityState === "visible" && refreshBadges(), POLL_MS);
  document.addEventListener("visibilitychange", onVisible);
};

const stop = () => {
  clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisible);
};

const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
};

export const markRead = async (id) => {
  set({
    ...state,
    unread: Math.max(0, state.unread - (state.items.find((n) => n._id === id && !n.read) ? 1 : 0)),
    items: state.items.map((n) => (n._id === id ? { ...n, read: true } : n)),
  });
  try {
    await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, { headers: authHeader() });
  } catch {
    refreshBadges();
  }
};

export const markAllRead = async () => {
  set({ ...state, unread: 0, items: state.items.map((n) => ({ ...n, read: true })) });
  try {
    await axios.patch(`${API_URL}/api/notifications/read-all`, {}, { headers: authHeader() });
  } catch {
    refreshBadges();
  }
};

export default function useBadges() {
  return useSyncExternalStore(subscribe, () => state);
}
