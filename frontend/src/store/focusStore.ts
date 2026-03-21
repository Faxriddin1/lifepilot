import { create } from 'zustand';
import type { FocusSession } from '@/types';

interface FocusState {
  activeSession: FocusSession | null;
  elapsedSeconds: number;
  isPaused: boolean;
  _intervalId: ReturnType<typeof setInterval> | null;

  setSession: (session: FocusSession) => void;
  tick: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  clearSession: () => void;
  startInterval: () => void;
  stopInterval: () => void;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  activeSession: null,
  elapsedSeconds: 0,
  isPaused: false,
  _intervalId: null,

  setSession: (session) => {
    get().stopInterval();
    const startedAt = Date.now();
    localStorage.setItem('focus_session', JSON.stringify(session));
    localStorage.setItem('focus_started_at', String(startedAt));
    localStorage.removeItem('focus_paused_elapsed');
    set({ activeSession: session, elapsedSeconds: 0, isPaused: false });
    get().startInterval();
  },

  tick: () => {
    const { activeSession, isPaused } = get();
    if (!activeSession || isPaused) return;

    const startedAt = Number(localStorage.getItem('focus_started_at') || '0');
    const pausedElapsed = Number(localStorage.getItem('focus_paused_elapsed') || '0');
    if (!startedAt) return;

    const elapsed = pausedElapsed + Math.floor((Date.now() - startedAt) / 1000);
    const total = activeSession.duration * 60;

    if (elapsed >= total) {
      // Auto-complete: don't clear here, let the hook handle API call
      set({ elapsedSeconds: total });
    } else {
      set({ elapsedSeconds: elapsed });
    }
  },

  pauseTimer: () => {
    const { elapsedSeconds } = get();
    get().stopInterval();
    localStorage.setItem('focus_paused_elapsed', String(elapsedSeconds));
    localStorage.removeItem('focus_started_at');
    set({ isPaused: true });
  },

  resumeTimer: () => {
    localStorage.setItem('focus_started_at', String(Date.now()));
    set({ isPaused: false });
    get().startInterval();
  },

  clearSession: () => {
    get().stopInterval();
    localStorage.removeItem('focus_session');
    localStorage.removeItem('focus_started_at');
    localStorage.removeItem('focus_paused_elapsed');
    set({ activeSession: null, elapsedSeconds: 0, isPaused: false });
  },

  startInterval: () => {
    get().stopInterval();
    const id = setInterval(() => get().tick(), 1000);
    set({ _intervalId: id });
  },

  stopInterval: () => {
    const { _intervalId } = get();
    if (_intervalId) {
      clearInterval(_intervalId);
      set({ _intervalId: null });
    }
  },
}));

/** Restore active focus session from localStorage on app load */
export function restoreFocusSession() {
  const raw = localStorage.getItem('focus_session');
  if (!raw) return;

  try {
    const session = JSON.parse(raw) as FocusSession;
    const startedAt = Number(localStorage.getItem('focus_started_at') || '0');
    const pausedElapsed = Number(localStorage.getItem('focus_paused_elapsed') || '0');
    const isPaused = !startedAt && pausedElapsed > 0;

    const store = useFocusStore.getState();
    store.stopInterval();

    useFocusStore.setState({
      activeSession: session,
      isPaused,
      elapsedSeconds: isPaused
        ? pausedElapsed
        : pausedElapsed + Math.floor((Date.now() - startedAt) / 1000),
    });

    if (!isPaused) {
      store.startInterval();
    }
  } catch {
    localStorage.removeItem('focus_session');
  }
}
