'use client';

import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useCookieGame } from '@/context/CookieGameContext';
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

function MilestoneCardView({ m, count }: { m: CookieMilestone; count: number }) {
  const reached = count >= m.threshold;
  const remaining = Math.max(0, m.threshold - count);
  return (
    <CardBox $reached={reached} $highlight={!!m.highlight}>
      <span className="emoji" aria-hidden>{m.emoji}</span>
      <div className="body">
        <div className="label">
          {m.threshold.toLocaleString()} · {m.label}
          {m.highlight && <span className="big"> — grand prize</span>}
        </div>
        <div className="reward">{m.reward}</div>
      </div>
      <div className="status">
        {reached
          ? <span className="check" aria-label="unlocked">✓</span>
          : <span className="left">{remaining.toLocaleString()} to go</span>}
      </div>
    </CardBox>
  );
}

// Full panel content (caller wraps it in a flip page). Lives on the right page
// of the cookie spread on desktop.
export function CookieHud() {
  const { count, remainingMs, started, expired, reached } = useCookieGame();
  const timeText = expired ? "time's up" : started ? formatMMSS(remainingMs) : formatMMSS(COOKIE_GAME.windowMs);

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
        {COOKIE_GAME.milestones.map((m) => <MilestoneCardView key={m.id} m={m} count={count} />)}
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

export function CookieGameStrip() {
  const { count, remainingMs, started, expired } = useCookieGame();
  return (
    <StripWrap>
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
