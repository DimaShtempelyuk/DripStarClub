'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import {
  COOKIE_GAME,
  milestonesReached,
  nextMilestone,
  type CookieMilestone,
} from '@/lib/cookieGame';

const STORAGE_KEY = 'dripstar_cookie_game';

// A single drawn crayon mark on the cookie (visual feedback only — the SCORE is
// the `count` integer, decoupled so we never render thousands of SVGs).
export interface CookieMark {
  id: string;
  xPct: number;
  yPct: number;
  seed: number;
  colorIndex: number; // index into COOKIE_GAME.rainbowColors (used from Phase 3)
}

interface ClaimedMap {
  discount: boolean;
  addin: boolean;
  magazine: boolean;
}

// Everything that survives a reload.
interface PersistedGame {
  count: number;
  startedAt: number | null;
  email: string | null;
  emailConsent: boolean;
  emailPrompted: boolean;
  claimed: ClaimedMap;
}

const DEFAULT_GAME: PersistedGame = {
  count: 0,
  startedAt: null,
  email: null,
  emailConsent: false,
  emailPrompted: false,
  claimed: { discount: false, addin: false, magazine: false },
};

export interface CookieGameValue {
  enabled: boolean;
  count: number;
  marks: CookieMark[];
  // timer
  started: boolean;
  expired: boolean;
  remainingMs: number;
  // milestone-driven visual state (derived from count → permanent once passed)
  rainbowOn: boolean;
  shakeOn: boolean;
  outlineOn: boolean;
  // milestone info
  reached: CookieMilestone[];
  next: CookieMilestone | null;
  // email
  email: string | null;
  emailConsent: boolean;
  shouldPromptEmail: boolean;
  /** bump to force the email modal open (e.g. from a pending reward card) */
  emailPromptRequest: number;
  claimed: ClaimedMap;
  // actions
  circle: (pos?: { xPct: number; yPct: number }) => void;
  submitEmail: (email: string, consent: boolean) => void;
  markEmailPrompted: () => void;
  openEmailPrompt: () => void;
  claim: (id: keyof ClaimedMap) => void;
  resetGame: () => void;
  // dev/testing helpers (surfaced only via CookieDevPanel when devMode is on)
  devAddCount: (delta: number) => void;
  devExpire: () => void;
}

const CookieGameContext = createContext<CookieGameValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Defensive read of persisted JSON — tolerate corrupt / older shapes.
function sanitize(raw: unknown): Partial<PersistedGame> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<PersistedGame> = {};
  if (typeof r.count === 'number' && r.count >= 0) out.count = Math.floor(r.count);
  if (typeof r.startedAt === 'number' || r.startedAt === null) out.startedAt = r.startedAt as number | null;
  if (typeof r.email === 'string' || r.email === null) out.email = r.email as string | null;
  if (typeof r.emailConsent === 'boolean') out.emailConsent = r.emailConsent;
  if (typeof r.emailPrompted === 'boolean') out.emailPrompted = r.emailPrompted;
  if (r.claimed && typeof r.claimed === 'object') {
    const c = r.claimed as Record<string, unknown>;
    out.claimed = { discount: !!c.discount, addin: !!c.addin, magazine: !!c.magazine };
  }
  return out;
}

export function CookieGameProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<PersistedGame>(DEFAULT_GAME);
  const [marks, setMarks] = useState<CookieMark[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [emailPromptRequest, setEmailPromptRequest] = useState(0);

  const gameRef = useRef(game);
  const countRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep refs in lockstep so async writers (debounce, sound) read fresh values
  useEffect(() => { gameRef.current = game; countRef.current = game.count; }, [game]);

  // ── hydrate once from localStorage ────────────────────────────────────────────
  useEffect(() => {
    let initial = DEFAULT_GAME;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) initial = { ...DEFAULT_GAME, ...sanitize(JSON.parse(raw)) };
    } catch { /* ignore */ }
    // first-load mode: stamp the clock now (but never overwrite a persisted start)
    if (initial.startedAt == null && COOKIE_GAME.timerStartsOn === 'first-load') {
      initial = { ...initial, startedAt: Date.now() };
    }
    gameRef.current = initial;
    countRef.current = initial.count;
    setGame(initial);
    setNow(Date.now());
    setHydrated(true);
  }, []);

  // ── debounced persist (never write on every click) ────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gameRef.current)); } catch { /* ignore */ }
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [game, hydrated]);

  // ── flush on hide/unload so a fast session isn't lost ─────────────────────────
  useEffect(() => {
    const flush = () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gameRef.current)); } catch { /* ignore */ }
    };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // ── derived timer state ───────────────────────────────────────────────────────
  const started = game.startedAt != null;
  const elapsed = started ? now - (game.startedAt as number) : 0;
  const remainingMs = started ? Math.max(0, COOKIE_GAME.windowMs - elapsed) : COOKIE_GAME.windowMs;
  const expired = started && remainingMs <= 0;

  // 1s clock — only while the window is actually live
  useEffect(() => {
    if (!COOKIE_GAME.enabled || !started || expired) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [started, expired]);

  // ── lazy click sound ──────────────────────────────────────────────────────────
  const playClick = useCallback(() => {
    let a = audioRef.current;
    if (!a) {
      a = new Audio('/sounds/click.mp3');
      a.volume = 0.6;
      audioRef.current = a;
    }
    try { a.currentTime = 0; } catch { /* ignore */ }
    a.play().catch(() => undefined);
  }, []);

  // ── actions ───────────────────────────────────────────────────────────────────
  const circle = useCallback((pos?: { xPct: number; yPct: number }) => {
    if (!COOKIE_GAME.enabled) return;

    setGame((prev) => {
      let startedAt = prev.startedAt;
      if (startedAt == null && COOKIE_GAME.timerStartsOn === 'first-circle') {
        startedAt = Date.now();
      }
      const isExpired = startedAt != null && Date.now() - startedAt >= COOKIE_GAME.windowMs;
      if (isExpired && COOKIE_GAME.freezeOnExpire) {
        // window's over — keep feedback, but the score is frozen
        return prev.startedAt === startedAt ? prev : { ...prev, startedAt };
      }
      return { ...prev, startedAt, count: prev.count + 1 };
    });

    // capped visual mark (not persisted — pure feedback)
    if (pos) {
      setMarks((prev) => {
        const mark: CookieMark = {
          id: uid(),
          xPct: pos.xPct,
          yPct: pos.yPct,
          seed: Math.floor(Math.random() * 1e9),
          colorIndex: countRef.current % COOKIE_GAME.rainbowColors.length,
        };
        const next = [...prev, mark];
        return next.length > COOKIE_GAME.maxVisibleMarks
          ? next.slice(next.length - COOKIE_GAME.maxVisibleMarks)
          : next;
      });
    }

    playClick();
  }, [playClick]);

  const submitEmail = useCallback((email: string, consent: boolean) => {
    setGame((p) => ({ ...p, email, emailConsent: consent, emailPrompted: true }));
  }, []);

  const markEmailPrompted = useCallback(() => {
    setGame((p) => (p.emailPrompted ? p : { ...p, emailPrompted: true }));
  }, []);

  const openEmailPrompt = useCallback(() => setEmailPromptRequest((n) => n + 1), []);

  const claim = useCallback((id: keyof ClaimedMap) => {
    setGame((p) => (p.claimed[id] ? p : { ...p, claimed: { ...p.claimed, [id]: true } }));
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current = DEFAULT_GAME;
    countRef.current = 0;
    setGame(DEFAULT_GAME);
    setMarks([]);
    setNow(Date.now());
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  // ── dev helpers ───────────────────────────────────────────────────────────────
  const devAddCount = useCallback((delta: number) => {
    setGame((p) => {
      const count = Math.max(0, p.count + delta);
      const startedAt = p.startedAt == null && delta > 0 ? Date.now() : p.startedAt;
      return { ...p, count, startedAt };
    });
  }, []);

  const devExpire = useCallback(() => {
    setGame((p) => ({ ...p, startedAt: Date.now() - COOKIE_GAME.windowMs - 1000 }));
  }, []);

  // ── derived milestone state ───────────────────────────────────────────────────
  const rainbowOn = game.count >= COOKIE_GAME.rainbowAfter;
  const shakeOn = game.count >= COOKIE_GAME.shakeAfter;
  const outlineOn = game.count >= COOKIE_GAME.rainbowOutlineAt;
  const reached = milestonesReached(game.count);
  const next = nextMilestone(game.count);
  const shouldPromptEmail = game.count >= COOKIE_GAME.emailGateAt && !game.emailPrompted && !game.email;

  const value: CookieGameValue = {
    enabled: COOKIE_GAME.enabled,
    count: game.count,
    marks,
    started,
    expired,
    remainingMs,
    rainbowOn,
    shakeOn,
    outlineOn,
    reached,
    next,
    email: game.email,
    emailConsent: game.emailConsent,
    shouldPromptEmail,
    emailPromptRequest,
    claimed: game.claimed,
    circle,
    submitEmail,
    markEmailPrompted,
    openEmailPrompt,
    claim,
    resetGame,
    devAddCount,
    devExpire,
  };

  return <CookieGameContext.Provider value={value}>{children}</CookieGameContext.Provider>;
}

export function useCookieGame() {
  const ctx = useContext(CookieGameContext);
  if (!ctx) throw new Error('useCookieGame must be used within CookieGameProvider');
  return ctx;
}
