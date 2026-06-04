# 🍪 Cookie Circle Mini-Game — Build Plan & Action List

> **Purpose:** turn the existing cookie "tutorial" into a timed milestone mini-game.
> **How to resume in a fresh chat:** paste this whole file. It is self-contained —
> it lists the stack, the relevant files, the locked decisions, and per-phase
> checklists. Start at the lowest unchecked phase.

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

### Phase 2 · Game HUD (right page desktop / strip mobile)
- [ ] `src/components/CookieGamePanel.tsx` (desktop right-page): **segmented progress bar** (3 equal segments 0–200 / 200–800 / 800–3000 so each milestone is reachable on screen), 3 milestone cards (emoji, label, reward, locked/unlocked), live count + time. 3000 card visually **highlighted** ("super nice" — glow/rainbow border).
- [ ] In `MagazineHome.tsx` `pages[]`: desktop → replace cookie-spread right page (EDITORIALS[0]) with `<CookieGamePanel/>`; move "Wear the moment" deeper (A4).
- [ ] Mobile (`isMobile`): render a **compact `CookieGameStrip`** docked at the bottom of the cookie page (slim bar + 3 pips + count). No second page.
- [ ] Style to match black/editorial theme; pull all copy/colors from config.
- **Acceptance:** progress + milestones visible and correct on desktop right page and mobile strip; updates live as you circle.
- **Safe to stop:** ✅

### Phase 3 · Milestone visuals (rainbow + shake, global & persistent)
- [ ] Parametrize `CrayonCircle` with optional `colors?: string[]`; when `rainbowOn`, new circles cycle `COOKIE_GAME.rainbowColors` across the 3 strokes (discrete colors — **no filters**).
- [ ] Apply rainbow to **all** circles (cookie + products) once persisted `count >= rainbowAfter`.
- [ ] `shakeOn` (count >= shakeAfter): quick shake keyframe on `BookWrap` per circle click, **any page**, gated by `prefers-reduced-motion`.
- [ ] Persist `rainbow`/`shake` flags so they stay on after reload and over real product circling.
- **Acceptance:** after 200 → rainbow circles everywhere; after 800 → book shakes per click everywhere; both survive reload; reduced-motion disables shake.
- **Safe to stop:** ✅

### Phase 4 · Email gate at 200
- [ ] `src/components/CookieEmailModal.tsx`: opens when `count` first crosses `emailGateAt`. Explains the game, email input + consent checkbox ("allow us to email you to participate"), **highlights the 3000 prize**. Focus-trap, ESC, labelled inputs, validation.
- [ ] New route `src/app/api/cookie-signup/route.ts` (POST) — stub: validate, 200 OK, console.log (swap to ESP later).
- [ ] On submit: store `email`/`emailConsent` locally, POST to stub, reveal the 5% reward (A3).
- **Acceptance:** modal fires once at 200, validates, persists, posts to stub; reward reveals after submit.
- **Safe to stop:** ✅

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

## 11. Dev reset snippet
```js
// paste in devtools console to replay the game
localStorage.removeItem('dripstar_cookie_game'); location.reload();
```
