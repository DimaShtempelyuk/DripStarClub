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
  /** dev/testing: show the on-screen count controls (CookieDevPanel) */
  devMode: boolean;
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
  /** semi-milestone: magazine gains a rainbow halo + fireworks unlock here */
  rainbowOutlineAt: number;
  /** once shake unlocks, fire the (varied) shake every Nth circle */
  shakeEvery: number;
  /** once the outline tier unlocks, a fireworks blast every Nth circle */
  blastEvery: number;
  /** cap on simultaneously-rendered crayon marks (perf — never render 3000) */
  maxVisibleMarks: number;
  /** code revealed when the 5% discount is claimed (visual until Shopify wiring) */
  discountCode: string;
  /** Shopify product handle of the grand-prize magazine. Fetched on claim and
   *  added to the cart as a real $0 line (the product must be availableForSale).
   *  Falls back to a visual bag strip if it can't be added. */
  magazineHandle: string;
  /** Shopify product title of the grand-prize magazine */
  magazineProductName: string;
  /** copy for the visual free-magazine bag strip (Phase 5) */
  magazineRewardTitle: string;
  magazineRewardSubtitle: string;
  /** claimed-state card copy for the 800 / 3000 rewards (Phase 5) */
  addinClaimedCopy: string;
  magazineClaimedCopy: string;
  /** discrete palette cycled per circle (NO css hue-rotate — Chrome paint bug) */
  rainbowColors: string[];
  milestones: CookieMilestone[];
}

// ─── DEV MODE ─────────────────────────────────────────────────────────────────
// `true`  → tiny 10 / 30 / 50 thresholds + the on-screen dev panel (fast testing).
// `false` → production 200 / 800 / 3000 and no panel.  ← FLIP THIS BEFORE SHIPPING.
const DEV_MODE = true;

const THRESHOLDS = DEV_MODE
  ? { discount: 10, addin: 30, outline: 40, magazine: 50 }
  : { discount: 200, addin: 800, outline: 2000, magazine: 3000 };

// The grand-prize product — matches the Shopify product title so the visual
// reward copy and the future real cart line stay in sync (§7).
const MAGAZINE_NAME = 'D* Magazine';

export const COOKIE_GAME: CookieGameConfig = {
  enabled: true,
  devMode: DEV_MODE,
  windowMs: 60 * 60 * 1000, // 1 hour
  timerStartsOn: 'first-circle',
  freezeOnExpire: true,

  // rainbow ties to milestone 1, shake to milestone 2, free mag to milestone 3
  emailGateAt: THRESHOLDS.discount,
  rainbowAfter: THRESHOLDS.discount,
  shakeAfter: THRESHOLDS.addin,
  rainbowOutlineAt: THRESHOLDS.outline,
  freeMagazineAt: THRESHOLDS.magazine,
  shakeEvery: 5,
  blastEvery: DEV_MODE ? 3 : 15,
  maxVisibleMarks: 40,
  discountCode: 'DRIP5',
  // Phase 5 reward fulfilment — visual now, swap-ready for Shopify (§7).
  magazineHandle: 'd-magazine', // Shopify product handle → fetched on claim as a real $0 line
  magazineProductName: MAGAZINE_NAME,
  magazineRewardTitle: 'Free magazine unlocked',
  magazineRewardSubtitle: `${MAGAZINE_NAME} · shipped with your order`,
  addinClaimedCopy: 'Mystery add-in — included with your order',
  magazineClaimedCopy: `${MAGAZINE_NAME} added — free`,

  rainbowColors: ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#007aff', '#af52de'],

  milestones: [
    { id: 'discount', threshold: THRESHOLDS.discount, label: '5% OFF',  reward: '5% off your whole order',                                       emoji: '🏷️' },
    { id: 'addin',    threshold: THRESHOLDS.addin,    label: 'MYSTERY', reward: 'A random special item from our add-ins',                        emoji: '🎁' },
    { id: 'magazine', threshold: THRESHOLDS.magazine, label: 'THE MAG', reward: `A printed copy of ${MAGAZINE_NAME}, shipped free with your order`, emoji: '📖', highlight: true },
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
