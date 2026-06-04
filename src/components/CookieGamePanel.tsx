'use client';

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useCookieGame } from '@/context/CookieGameContext';
import { useCart } from '@/context/CartContext';
import {
  COOKIE_GAME,
  segmentedProgress,
  formatMMSS,
  type CookieMilestone,
} from '@/lib/cookieGame';

const GOLD = '#ffcf6b';

// ─── shared milestone math ────────────────────────────────────────────────────
const tickLeft = (i: number) => `${((i + 1) / COOKIE_GAME.milestones.length) * 100}%`;

// ═══ DESKTOP PANEL — right page of the cookie spread ═══════════════════════════

const Panel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: clamp(1.5rem, 4vh, 3rem) clamp(1.4rem, 3vw, 2.4rem);
  background: radial-gradient(ellipse at 70% 0%, #241a0a 0%, #140e04 55%, #0b0802 100%);
  color: #fff;
  overflow: hidden;
  user-select: none;
`;

const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.6rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 1.4rem;

  .time { color: ${GOLD}; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0.1em; }
`;

const CountBlock = styled.div`
  margin-bottom: 1.5rem;
  .n { font-size: clamp(2.8rem, 9vw, 4.6rem); font-weight: 800; line-height: 0.95; }
  .lbl {
    font-size: 0.62rem; letter-spacing: 0.24em; text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4); margin-top: 0.45rem;
  }
`;

const Bar = styled.div`
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.4rem 0 2.6rem;
`;
const Fill = styled.div`
  position: absolute;
  top: 0; bottom: 0; left: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, ${GOLD}, #ff9f43);
  transition: width 0.45s cubic-bezier(0.2, 0, 0.2, 1);
`;
const Tick = styled.div<{ $reached: boolean }>`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);

  .dot {
    display: block;
    width: 12px; height: 12px;
    border-radius: 50%;
    border: 2px solid ${({ $reached }) => ($reached ? GOLD : 'rgba(255,255,255,0.3)')};
    background: ${({ $reached }) => ($reached ? GOLD : '#1a1206')};
    box-shadow: ${({ $reached }) => ($reached ? `0 0 8px ${GOLD}` : 'none')};
    transition: all 0.3s;
  }
  .n {
    position: absolute;
    top: 15px; left: 50%;
    transform: translateX(-50%);
    font-size: 0.56rem; font-weight: 700; letter-spacing: 0.04em;
    color: ${({ $reached }) => ($reached ? GOLD : 'rgba(255,255,255,0.4)')};
    white-space: nowrap;
  }
`;

const ExpiredBlock = styled.div`
  margin-bottom: 1.5rem;
  .big { font-size: clamp(1.8rem, 6vw, 2.8rem); font-weight: 800; color: ${GOLD}; margin-bottom: 0.5rem; }
  .score { font-size: 0.9rem; color: rgba(255, 255, 255, 0.8); b { color: #fff; } }
  .earned { margin-top: 0.4rem; font-size: 0.78rem; color: rgba(255, 255, 255, 0.55); }
`;

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: auto;
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.06); }
  50%      { box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 0 22px rgba(255,120,200,0.32); }
`;

const CardBox = styled.div<{ $reached: boolean; $highlight: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.8rem 0.95rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  opacity: ${({ $reached }) => ($reached ? 1 : 0.74)};
  transition: opacity 0.3s, border-color 0.3s, background 0.3s, box-shadow 0.3s;

  .emoji { font-size: 1.5rem; line-height: 1; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5)); }
  .body { flex: 1; min-width: 0; }
  .label {
    font-size: 0.63rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700;
    color: #fff; margin-bottom: 0.22rem;
  }
  .label .big { color: ${GOLD}; }
  .reward { font-size: 0.74rem; line-height: 1.35; color: rgba(255, 255, 255, 0.6); }
  .status { flex-shrink: 0; }
  .check {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%;
    background: ${GOLD}; color: #1a1206; font-size: 0.8rem; font-weight: 800;
  }
  .left {
    font-size: 0.55rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4); white-space: nowrap;
  }

  ${({ $reached }) => $reached && css`
    border-color: rgba(255, 207, 107, 0.5);
    background: rgba(255, 207, 107, 0.07);
  `}
  ${({ $highlight, $reached }) => $highlight && $reached && css`
    box-shadow: 0 0 22px rgba(255, 120, 200, 0.35);
  `}
  ${({ $highlight, $reached }) => $highlight && !$reached && css`
    animation: ${glowPulse} 2.8s ease-in-out infinite;
    @media (prefers-reduced-motion: reduce) { animation: none; }
  `}
`;

const ClaimBtn = styled.button`
  padding: 0.34rem 0.72rem;
  border-radius: 8px;
  border: none;
  background: #ffcf6b;
  color: #1a1206;
  font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, transform 0.05s;
  &:hover { background: #ffd980; }
  &:active { transform: translateY(1px); }
`;

function MilestoneCardView({ m, count, emailCaptured, claimed, onClaim }: {
  m: CookieMilestone; count: number; emailCaptured: boolean; claimed: boolean;
  onClaim: (m: CookieMilestone) => void;
}) {
  const reached = count >= m.threshold;
  const remaining = Math.max(0, m.threshold - count);

  // Default (locked) state; reached rewards override copy + the right-hand slot.
  let reward: React.ReactNode = m.reward;
  let status: React.ReactNode = <span className="left">{remaining.toLocaleString()} to go</span>;

  if (reached) {
    if (m.id === 'discount') {
      // 5%-off is gated on email: reached-but-no-email → "Claim" (opens the modal).
      if (emailCaptured) {
        reward = <>Code <b style={{ color: '#ffcf6b' }}>{COOKIE_GAME.discountCode}</b> — ready at checkout</>;
        status = <span className="check" aria-label="unlocked">✓</span>;
      } else {
        reward = 'Add your email to claim your 5% code';
        status = <ClaimBtn onClick={() => onClaim(m)}>Claim</ClaimBtn>;
      }
    } else if (m.id === 'magazine') {
      // grand prize: explicit claim → drops a free line in the bag.
      if (claimed) {
        reward = COOKIE_GAME.magazineClaimedCopy;
        status = <span className="check" aria-label="unlocked">✓</span>;
      } else {
        status = <ClaimBtn onClick={() => onClaim(m)}>Claim</ClaimBtn>;
      }
    } else {
      // add-in: auto-included once reached, no action needed.
      reward = COOKIE_GAME.addinClaimedCopy;
      status = <span className="check" aria-label="unlocked">✓</span>;
    }
  }

  return (
    <CardBox $reached={reached} $highlight={!!m.highlight}>
      <span className="emoji" aria-hidden>{m.emoji}</span>
      <div className="body">
        <div className="label">
          {m.threshold.toLocaleString()} · {m.label}
          {m.highlight && <span className="big"> — grand prize</span>}
        </div>
        <div className="reward">{reward}</div>
      </div>
      <div className="status">{status}</div>
    </CardBox>
  );
}

// Full panel content (caller wraps it in a flip page). Lives on the right page
// of the cookie spread on desktop.
export function CookieHud() {
  const { count, remainingMs, started, expired, reached, email, claimed, claim, openEmailPrompt } = useCookieGame();
  const { openDrawer } = useCart();
  const timeText = expired ? "time's up" : started ? formatMMSS(remainingMs) : formatMMSS(COOKIE_GAME.windowMs);

  const handleClaim = (m: CookieMilestone) => {
    if (m.id === 'discount') { openEmailPrompt(); return; }
    if (m.id === 'magazine') {
      claim('magazine');
      // §7 swap: when COOKIE_GAME.magazineVariantId is set, also add that real
      // $0 variant to the Shopify cart here — the visual bag strip then auto-hides.
      openDrawer();
    }
  };

  return (
    <Panel>
      <Eyebrow>
        <span>The Cookie Game</span>
        <span className="time">{timeText}</span>
      </Eyebrow>

      {expired ? (
        <ExpiredBlock>
          <div className="big">Time&apos;s up!</div>
          <div className="score">You circled <b>{count.toLocaleString()}</b> cookies.</div>
          <div className="earned">
            {reached.length > 0
              ? `You unlocked ${reached.length} reward${reached.length > 1 ? 's' : ''} 🎉`
              : 'So close — no rewards this run.'}
          </div>
        </ExpiredBlock>
      ) : (
        <>
          <CountBlock>
            <div className="n">{count.toLocaleString()}</div>
            <div className="lbl">cookies circled</div>
          </CountBlock>
          <Bar role="progressbar" aria-valuemin={0} aria-valuemax={COOKIE_GAME.freeMagazineAt} aria-valuenow={count}>
            <Fill style={{ width: `${segmentedProgress(count) * 100}%` }} />
            {COOKIE_GAME.milestones.map((m, i) => (
              <Tick key={m.id} $reached={count >= m.threshold} style={{ left: tickLeft(i) }}>
                <span className="dot" />
                <span className="n">{m.threshold.toLocaleString()}</span>
              </Tick>
            ))}
          </Bar>
        </>
      )}

      <Cards>
        {COOKIE_GAME.milestones.map((m) => (
          <MilestoneCardView
            key={m.id}
            m={m}
            count={count}
            emailCaptured={!!email}
            claimed={claimed[m.id]}
            onClaim={handleClaim}
          />
        ))}
      </Cards>
    </Panel>
  );
}

// ═══ MOBILE STRIP — docked on the cookie page (one-page portrait) ══════════════

const StripWrap = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 6;
  padding: 0.85rem 1.1rem calc(0.95rem + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(8, 6, 2, 0.97) 55%, transparent);
  pointer-events: none; /* taps fall through to the cookie */
  color: #fff;

  /* desktop uses the full right-page panel instead */
  @media (min-width: 769px) { display: none; }

  .top {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .n { font-size: 1.4rem; font-weight: 800; line-height: 1; }
  .lbl {
    font-size: 0.55rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45); margin-left: 0.4rem;
  }
  .time {
    font-size: 0.72rem; font-weight: 700; color: ${GOLD};
    font-variant-numeric: tabular-nums; letter-spacing: 0.08em;
  }
`;

const StripBar = styled.div`
  position: relative;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
`;
const StripFill = styled.div`
  position: absolute;
  top: 0; bottom: 0; left: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, ${GOLD}, #ff9f43);
  transition: width 0.4s cubic-bezier(0.2, 0, 0.2, 1);
`;
const StripPip = styled.div<{ $reached: boolean; $highlight: boolean }>`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.72rem;
  line-height: 1;
  filter: ${({ $reached }) => ($reached ? 'none' : 'grayscale(1)')};
  opacity: ${({ $reached }) => ($reached ? 1 : 0.5)};
  transition: opacity 0.3s, filter 0.3s;
  text-shadow: ${({ $reached, $highlight }) => ($reached && $highlight ? '0 0 8px rgba(255,120,200,0.7)' : 'none')};
`;

// Mobile has no reward cards, so the grand-prize claim lives on the strip.
const StripClaim = styled.button`
  pointer-events: auto;
  width: 100%;
  margin-bottom: 0.6rem;
  padding: 0.55rem;
  border: none;
  border-radius: 9px;
  background: linear-gradient(90deg, #ffcf6b, #ff9f43);
  color: #1a1206;
  font-size: 0.66rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.05s;
  &:active { transform: translateY(1px); }
`;

const StripClaimed = styled.div`
  margin-bottom: 0.55rem;
  font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: #ffcf6b; font-weight: 700;
`;

export function CookieGameStrip() {
  const { count, remainingMs, started, expired, claimed, claim } = useCookieGame();
  const { openDrawer } = useCart();
  const magReached = count >= COOKIE_GAME.freeMagazineAt;
  return (
    <StripWrap>
      {magReached && !claimed.magazine && (
        <StripClaim onClick={() => { claim('magazine'); openDrawer(); }}>
          📖 Claim your free {COOKIE_GAME.magazineProductName}
        </StripClaim>
      )}
      {claimed.magazine && <StripClaimed>📖 {COOKIE_GAME.magazineProductName} in your bag</StripClaimed>}
      <div className="top">
        <span>
          <span className="n">{count.toLocaleString()}</span>
          <span className="lbl">circled</span>
        </span>
        <span className="time">{expired ? "time's up" : started ? formatMMSS(remainingMs) : formatMMSS(COOKIE_GAME.windowMs)}</span>
      </div>
      <StripBar>
        <StripFill style={{ width: `${segmentedProgress(count) * 100}%` }} />
        {COOKIE_GAME.milestones.map((m, i) => (
          <StripPip
            key={m.id}
            $reached={count >= m.threshold}
            $highlight={!!m.highlight}
            style={{ left: tickLeft(i) }}
            title={`${m.threshold}: ${m.reward}`}
          >
            {m.emoji}
          </StripPip>
        ))}
      </StripBar>
    </StripWrap>
  );
}
