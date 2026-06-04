// ─── Cookie mini-game: central config + pure helpers ──────────────────────────
// Every threshold, color, timing and string lives here so the game can be
// re-themed or re-balanced without touching components. Import `COOKIE_GAME`
// anywhere that needs a knob.

export interface CookieMilestone {
  id: 'discount' | 'addin' | 'magazine';
  /** circles required to unlock */
  threshold: number;
  /** short chip label, e.g. "5% OFF" */
  label: string;
  /** full reward sentence shown on the card */
  reward: string;
  emoji: string;
  /** the big finale reward — rendered with extra flair */
  highlight?: boolean;
}

export interface CookieGameConfig {
  /** master switch — set false to remove the whole game with one flag */
  enabled: boolean;
  /** length of the play window */
  windowMs: number;
  /** when the 1h clock starts ticking */
  timerStartsOn: 'first-circle' | 'first-load';
  /** when the window ends, stop counting (true) vs hard-lock the cookie (false) */
  freezeOnExpire: boolean;
  /** count that triggers the email modal */
  emailGateAt: number;
  /** circles go rainbow at/after this count */
  rainbowAfter: number;
  /** magazine shakes per click at/after this count */
  shakeAfter: number;
  /** free magazine reward count */
  freeMagazineAt: number;
  /** cap on simultaneously-rendered crayon marks (perf — never render 3000) */
  maxVisibleMarks: number;
  /** discrete palette cycled per circle (NO css hue-rotate — Chrome paint bug) */
  rainbowColors: string[];
  milestones: CookieMilestone[];
}

export const COOKIE_GAME: CookieGameConfig = {
  enabled: true,
  windowMs: 60 * 60 * 1000, // 1 hour
  timerStartsOn: 'first-circle',
  freezeOnExpire: true,

  emailGateAt: 200,
  rainbowAfter: 200,
  shakeAfter: 800,
  freeMagazineAt: 3000,
  maxVisibleMarks: 40,

  rainbowColors: ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#007aff', '#af52de'],

  milestones: [
    { id: 'discount', threshold: 200,  label: '5% OFF',  reward: '5% off your whole order',                                      emoji: '🏷️' },
    { id: 'addin',    threshold: 800,  label: 'MYSTERY', reward: 'A random special item from our add-ins',                       emoji: '🎁' },
    { id: 'magazine', threshold: 3000, label: 'THE MAG', reward: 'A printed copy of this magazine, shipped free with your order', emoji: '📖', highlight: true },
  ],
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Milestones whose threshold the count has reached. */
export function milestonesReached(count: number): CookieMilestone[] {
  return COOKIE_GAME.milestones.filter((m) => count >= m.threshold);
}

/** The next not-yet-reached milestone, or null when all are done. */
export function nextMilestone(count: number): CookieMilestone | null {
  return COOKIE_GAME.milestones.find((m) => count < m.threshold) ?? null;
}

/** mm:ss from a millisecond duration (clamped at 0). */
export function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * 0..1 progress along a SEGMENTED bar where every milestone gets an equal
 * visual segment — so 200 isn't a tiny sliver next to 3000. Used by the HUD.
 */
export function segmentedProgress(count: number): number {
  const ms = COOKIE_GAME.milestones;
  if (ms.length === 0) return 0;
  const seg = 1 / ms.length;
  let lower = 0;
  for (let i = 0; i < ms.length; i++) {
    const upper = ms[i].threshold;
    if (count < upper) {
      return seg * i + seg * ((count - lower) / (upper - lower));
    }
    lower = upper;
  }
  return 1;
}
