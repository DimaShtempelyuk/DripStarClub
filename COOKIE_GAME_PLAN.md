# 🍪 Cookie Circle Mini-Game — Build Plan & Action List

> **Purpose:** turn the existing cookie "tutorial" into a timed milestone mini-game.
> **How to resume in a fresh chat:** paste this whole file. It is self-contained —
> it lists the stack, the relevant files, the locked decisions, and per-phase
> checklists. Start at the lowest unchecked phase.

---

## 0. CURRENT STATUS — resume here
- **Branch:** `feature/cookie-game` (also fast-forwarded into `dev` + pushed → live preview).
- **Done:** Phase 0 (foundations) · Phase 1 (timer + wiring) · Phase 2 (HUD) · Phase 3 (rainbow circles + varied throttled shake + rainbow LED halo semi-milestone + behind-the-magazine fireworks) · **dev mode**.
- **DEV_MODE is currently `true`** (flag at top of `src/lib/cookieGame.ts`): test thresholds **10/30/50** + on-screen `CookieDevPanel`. **Set it `false` for production 200/800/3000 and to hide the panel** before a real launch.
- **Tiers:** rainbow circles @ milestone 1 (10/200) · varied shake every 5th click @ milestone 2 (30/800) · rainbow halo + fireworks-every-Nth-click @ semi-milestone `rainbowOutlineAt` (40/2000) · free magazine @ milestone 3 (50/3000).
- **Next:** Phase 4 (email gate at first milestone) → Phase 5 (reward states / free-magazine line, still visual) → Phase 6 (a11y + perf). Deferred: real Shopify wiring (§7).
- **Run locally:** `npm run dev` → http://localhost:3000. Reset game: `localStorage.removeItem('dripstar_cookie_game'); location.reload();`
- **Key files:** `src/lib/cookieGame.ts` (all config knobs) · `src/context/CookieGameContext.tsx` (state) · `src/components/CookieGamePanel.tsx` (HUD desktop + mobile strip) · `CookieTimerBar.tsx` · `CookieDevPanel.tsx` · `src/lib/fireworks.ts` · `src/components/MagazineHome.tsx` (cookie/HUD/halo/shake/fireworks wiring) · `CrayonCircle.tsx` (rainbow strokes).
- **Verify-on-handoff:** front cover halo = right half, back cover = left half (assumption — flip if wrong). Pre-existing Next `<Image fill height 0>` warnings on product pages are unrelated.

---

## 1. Project context (so a cold chat understands)

- **App:** `dripstar` — Next.js (App Router) + styled-components + Shopify Storefront API. Pure black theme, magazine UX (`react-pageflip`).
- **The magazine:** [`src/components/MagazineHome.tsx`](src/components/MagazineHome.tsx) builds a flat `pages[]` array. Opening spread after the cover = **CookieFlipPage (left)** + **EDITORIALS[0] "Wear the moment" (right)**. Products + editorials interleave after.
- **Cookie today:** `CookieFlipPage` clicks call `addCircle({ productId: COOKIE_ID })`. `COOKIE_ID = '__cookie__'` is a **demo sentinel** — never touches Shopify, and cookie circles are **deliberately NOT persisted** ([`CartContext.tsx`](src/context/CartContext.tsx) line ~106). Count today = `circles.filter(c => c.productId === COOKIE_ID).length`, resets on reload.
- **Circle visuals:** [`src/components/CrayonCircle.tsx`](src/components/CrayonCircle.tsx) — hardcoded **red** SVG strokes, framer-motion path draw. ⚠️ Has a documented Chrome paint bug worked around by avoiding SVG filters — **do NOT add CSS filters / hue-rotate**; use discrete stroke colors instead.
- **Count shown** in cookie page + [`Navbar.tsx`](src/components/Navbar.tsx).
- **Shopify** ([`src/lib/shopify.ts`](src/lib/shopify.ts)): cart create/get/add/remove/update + `checkoutUrl`. **No discount mutation, no email/customer capture, no add-ins collection** — all net-new (deferred).
- **Sound:** `/sounds/click.mp3` already plays per circle.

---

## 2. Decisions locked (from the user)

| Topic | Decision |
|---|---|
| **HUD placement** | Desktop: **right page of the cookie spread = the game panel**. Mobile: **compact progress strip docked on the cookie page** (single page). |
| **Rewards realness** | **Visual now, wire later.** Build the full unlock UX; rewards show as earned badges/codes. Real Shopify calls = deferred phase. |
| **Email capture** | **Store simply for now** — validate, persist locally, POST to a stub `/api/cookie-signup`. Swap to a real ESP later. |
| **Counts & fairness** | **Keep 200 / 800 / 3000, client-side** (localStorage). Accept it's gameable; 3000 is aspirational. Server validation = later. |
| **Timer** | 1hr window, **fixed countdown bar pinned top** (global, respects notch safe-area). |

---

## 3. Assumptions to confirm (sensible defaults — override any)

- **A1 — Timer starts on:** first **cookie click** (you don't lose time before discovering the game). _Alt: first page load._ → config `timerStartsOn`.
- **A2 — When timer expires:** counting **freezes**, HUD switches to a "time's up" summary (final score + rewards earned). Clicks still draw a mark for fun but don't count. _Alt: hard-lock the cookie._
- **A3 — Email gate:** the 200 reward (5% code) **reveals after email submit**. User may dismiss, but that reward stays "pending" until provided. _Alt: reward shown regardless._
- **A4 — "Wear the moment" editorial** (currently the right page) gets **moved one spread deeper** so it isn't lost. _Alt: drop it._
- **A5 — Game is one-shot per browser** (no auto-replay after the window). Dev reset = clear the localStorage key (snippet in §11).
- **A6 — Old "most circles wins a free tee" copy** (cookie page + RulesPanel) is **replaced** by the milestone framing. _Confirm we're dropping the "wins a free tee" line._

---

## 4. Central config (single source of truth — all knobs here)

> Theming priority: every threshold, color, timing, and string lives here so looks/values are tweakable without touching components.

**New file: `src/lib/cookieGame.ts`**
```ts
export interface CookieMilestone {
  id: 'discount' | 'addin' | 'magazine';
  threshold: number;
  label: string;        // short chip label
  reward: string;       // full reward copy
  emoji: string;
  highlight?: boolean;  // the big 3000 one
}

export const COOKIE_GAME = {
  enabled: true,
  windowMs: 60 * 60 * 1000,          // 1 hour
  timerStartsOn: 'first-circle',     // 'first-circle' | 'first-load'  (A1)
  freezeOnExpire: true,              // (A2)

  emailGateAt: 200,                  // milestone that triggers the email modal
  rainbowAfter: 200,                 // circles turn rainbow at/after this count
  shakeAfter: 800,                   // magazine shakes per click at/after this
  freeMagazineAt: 3000,

  // discrete palette (NO css hue-rotate — Chrome paint bug). Cycled per circle.
  rainbowColors: ['#ff3b30','#ff9500','#ffcc00','#34c759','#00c7be','#007aff','#af52de'],

  milestones: [
    { id: 'discount', threshold: 200,  label: '5% OFF',      reward: '5% off your whole order',                         emoji: '🏷️' },
    { id: 'addin',    threshold: 800,  label: 'MYSTERY',     reward: 'A random special item from our add-ins',          emoji: '🎁' },
    { id: 'magazine', threshold: 3000, label: 'THE MAG',     reward: 'A printed copy of this magazine, shipped free with your order', emoji: '📖', highlight: true },
  ] as CookieMilestone[],
} as const;
```

---

## 5. Architecture changes (read before Phase 0)

1. **Count is a NUMBER, decoupled from rendered marks.**
   ⚠️ Rendering 3000 animated `CrayonCircle` SVGs on one page will kill the browser. The game must track an **integer `count`** and render only a **capped ring-buffer of recent marks** (e.g. last 40) for feedback.
2. **New provider: `src/context/CookieGameContext.tsx`** (mounted inside `CartProvider`). Holds and persists game state; exposes `useCookieGame()`. Keeps the real cart untouched and makes the whole feature toggle-able via `COOKIE_GAME.enabled`.
3. **Debounced persistence.** Do **not** write localStorage on every click (3000 writes = jank). Write `count` at most every ~500ms + on `visibilitychange`/`pagehide`.
4. **Persisted, global milestone flags** drive permanent rainbow + shake — so they apply on *every* page later (even circling real products), per the brief.

**localStorage keys (new):** `dripstar_cookie_game` → `{ count, startedAt, email, emailConsent, claimed: {discount,addin,magazine}, rainbow, shake, freeMag }`.

---

## 6. Phases (batches) — stop/resume at any ✅

### Phase 0 · Foundations  _(no visual change)_ — ✅ DONE
- [x] Create `src/lib/cookieGame.ts` (config + helpers `milestonesReached`/`nextMilestone`/`formatMMSS`/`segmentedProgress`).
- [x] Create `src/context/CookieGameContext.tsx`: state `{count, startedAt, email, emailConsent, emailPrompted, claimed}` + ephemeral capped `marks[]` + derived `{remainingMs, expired, started, rainbowOn, shakeOn, reached, next, shouldPromptEmail}` + actions `circle(pos?)`, `submitEmail()`, `markEmailPrompted()`, `claim(id)`, `resetGame()`.
- [x] Wrap app with `CookieGameProvider` in [`layout.tsx`](src/app/layout.tsx) (inside `CartProvider`).
- [x] Debounced persistence (500ms) + flush on `pagehide`/`visibilitychange` + hydrate on mount with `sanitize()`.
- **Acceptance:** `useCookieGame()` works; count survives reload; nothing visually changed yet.
- **Safe to stop:** ✅  _Note: not yet consumed by any component — wire-up is Phase 1._

### Phase 1 · Timer + count wiring — ✅ DONE
- [x] `CookieFlipPage` calls `useCookieGame().circle(pos)` instead of `addCircle(COOKIE_ID)`; renders the capped `marks[]` buffer; counter shows persisted `count`; sound moved into the game ctx.
- [x] `startedAt` set on first circle (A1, `timerStartsOn: 'first-circle'`).
- [x] New `src/components/CookieTimerBar.tsx`: fixed top-center pill, `mm:ss`, safe-area inset, urgent (<60s) red state, hidden when `!started || expired || !enabled`. Rendered in `layout.tsx`.
- [x] Expiry freezes counting (A2) — handled in `circle()`.
- [x] Navbar cookie count reads game `count` (no more cart-derived cookie circles).
- **Acceptance:** clicking cookie increments a persisted count; timer counts down from first click; expiry freezes count; only last 40 marks render.
- **Safe to stop:** ✅ (playable core, no rewards UI yet)
- **Note:** `COOKIE_ID` is now dead-path-only inside `CartContext` (safe to delete in a later cleanup).

### Phase 2 · Game HUD (right page desktop / strip mobile) — ✅ DONE
- [x] `src/components/CookieGamePanel.tsx` exports `CookieHud` (desktop) + `CookieGameStrip` (mobile): **segmented progress bar** (equal segments via `segmentedProgress`), 3 milestone cards (emoji, label, reward, locked/unlocked + "X to go"), live count + time, **expired summary** state. 3000 card highlighted (pulse when locked, glow when unlocked).
- [x] `MagazineHome.tsx` `pages[]`: desktop inserts `<CookieHudPage>` as the cookie-spread right page; "Wear the moment" shifts one spread deeper (A4). Mobile keeps the editorial and docks `CookieGameStrip` on the cookie page.
- [x] `CookieGameStrip` docked bottom of the cookie page, hidden ≥769px via media query.
- [x] All copy/colors from config; refreshed stale copy (cookie text + RulesPanel); removed dead `PRIZE` knob.
- **Acceptance:** progress + milestones render on desktop right page and mobile strip; update live as you circle; verified HTTP 200 / clean compile.
- **Safe to stop:** ✅

### Phase 3 · Milestone visuals (rainbow + shake, global & persistent) — ✅ DONE
- [x] `CrayonCircle` takes optional `color`; in rainbow mode all 3 strokes derive from one palette hue via `withAlpha()` (discrete colors — **no filters**, dodges the Chrome paint bug).
- [x] Rainbow applied to **all** circles once `count >= rainbowAfter`: cookie marks use `colorIndex`; product circles use `seed % palette` (stable). Existing circles recolor too.
- [x] `shakeOn` (`count >= shakeAfter`): WAAPI "kick" on `BookWrap` fired from both cookie + product click handlers (any page), restarts per click, **gated by `prefers-reduced-motion`**.
- [x] rainbow/shake **derived from the persisted count** → permanent after reload and over real product circling (no separate flags needed).
- [x] **Juice pass:** shakes randomized (amp/dir/rotation/duration) + throttled to every `shakeEvery` (5) circles; new **semi-milestone** `rainbowOutlineAt` (40 dev / 2000 prod) → spinning **rainbow halo** around the magazine via isolated `BookOutlineSync` (book never re-renders); **fireworks** every `blastEvery` circle (3 dev / 15 prod) from `lib/fireworks.ts`. All reduced-motion gated. Dev panel gained a `✨@40` flag + `→40` jump.
- **Acceptance:** after 200 → rainbow everywhere; after 800 → varied kick every 5th click; after the outline tier → halo + fireworks every Nth click; survive reload; reduced-motion disables all motion. Verified clean compile / HTTP 200.
- **Safe to stop:** ✅

### Phase 4 · Email gate — ✅ DONE
- [x] `src/components/CookieEmailModal.tsx`: auto-opens when `count` crosses `emailGateAt` (10 dev / 200 prod), highlights the grand prize, email + **required** consent, validation, focus + ESC + backdrop-dismiss, reduced-motion gated. Success state reveals the 5% code.
- [x] `src/app/api/cookie-signup/route.ts` (POST, Web `Request`/`Response.json`) — validates + logs; returns `200 {ok}` / `422 invalid_email`. Swap the marked block for a real ESP later (§7).
- [x] On submit: best-effort POST to the stub, then `submitEmail()` persists locally + closes the gate; "Maybe later" dismisses (reward stays pending via `markEmailPrompted`).
- [x] HUD 5%-off card: **Claim** button until email captured (re-opens the modal via `openEmailPrompt`), then reveals code `DRIP5` (config `discountCode`).
- **Acceptance:** modal fires at the gate, validates, persists, posts to stub, reveals reward. Verified HTTP 200 + API 200/422.
- **Notes:** consent defaults **unchecked** (GDPR-safe) — pre-check it if you prefer conversion. `discountCode` is visual-only until Shopify wiring. Mobile strip has no re-claim button yet (modal auto-fires; only matters if dismissed).

### Phase 5 · Free magazine + reward states (still visual)
- [ ] At `freeMagazineAt` (3000): show the magazine as a **FREE pseudo-line in the bag** (visual, like the cookie sentinel) + mark `claimed.magazine`. Rainbow+shake already permanent from Phase 3.
- [ ] Reward badges: 5% → show code `COOKIE5` to copy; 800 → "Mystery add-in unlocked, included with your order"; 3000 → "Free magazine added".
- **Acceptance:** hitting each tier flips its card to claimed with the right copy; 3000 shows a free mag line in the bag.
- **Safe to stop:** ✅ (feature complete as a *visual* experience)

### Phase 6 · Polish & a11y
- [ ] `prefers-reduced-motion`: gate shake, path-draw, rainbow animation.
- [ ] Keyboard: focus + Enter/Space circles the cookie; modal a11y; timer/milestones screen-reader friendly (announce **milestones**, not the rapid count — `aria-live="polite"` only on milestone/time, count `aria-hidden` or throttled).
- [ ] Contrast pass on HUD; mobile strip layout check across breakpoints.
- [ ] Perf: confirm capped marks, debounced writes, no jank at high click rates.
- [ ] `track(event)` stub fired on milestone reached / email captured (analytics hook).
- **Acceptance:** Lighthouse a11y clean-ish; smooth at fast clicking; reduced-motion respected.

---

## 7. Deferred — real reward wiring (later, when Shopify is ready)

- **5% discount (real):** create a `COOKIE5` (5% off) code in Shopify Admin → add `cartDiscountCodesUpdate` mutation to `lib/shopify.ts` → apply on claim.
- **800 add-in (real):** make an **"add-ins" collection** of $0 (or near-$0) variants → on claim pick one at random → `addToCart($0 variant)`.
- **3000 magazine (real):** create a **$0 magazine variant** → auto-`addToCart` on claim (replaces the visual pseudo-line).
- **Email (real):** swap `/api/cookie-signup` stub for Klaviyo/Mailchimp/Shopify-customer (needs provider + key).
- **Anti-cheat (real):** move count to a rate-limited server route + storage if prizes become real money.

---

## 8. Copy / strings to reconcile (A6)
- `MagazineHome.tsx` `PRIZE` const + cookie page text ("most circles wins a free tee") → replace with milestone framing.
- `RulesPanel` cookie line → mention the timed milestone game + 3000 prize.

## 9. Risks / edge cases
- 3000 nodes → **must** cap rendered marks (§5.1).
- localStorage write storm → **must** debounce (§5.3).
- No CSS filters on circles (Chrome paint bug) → discrete colors only.
- Timer/score are client-side & cheatable (accepted for MVP).
- Replacing the right editorial page must keep `pages[]` length **even** (back-cover logic depends on it).

## 10. Files touched (quick map)
- **New:** `lib/cookieGame.ts`, `context/CookieGameContext.tsx`, `components/CookieTimerBar.tsx`, `components/CookieGamePanel.tsx`, `components/CookieGameStrip.tsx`, `components/CookieEmailModal.tsx`, `app/api/cookie-signup/route.ts`.
- **Edited:** `components/MagazineHome.tsx`, `components/CrayonCircle.tsx`, `components/Navbar.tsx`, `app/layout.tsx`, (copy) `RulesPanel`.

## 11. Dev mode & reset
- **`DEV_MODE`** flag at the top of [`cookieGame.ts`](src/lib/cookieGame.ts): `true` = **10/30/50** thresholds + on-screen **CookieDevPanel** (bottom-right: ±count, jump-to-milestone, reset, force-expire). **Set `false` before shipping** → restores 200/800/3000 and hides the panel.
- Manual reset (console): `localStorage.removeItem('dripstar_cookie_game'); location.reload();`
