'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { useCookieGame } from '@/context/CookieGameContext';
import { formatMMSS } from '@/lib/cookieGame';

const URGENT_MS = 60 * 1000; // last minute → urgent styling

const Bar = styled.div<{ $urgent: boolean }>`
  position: fixed;
  top: calc(0.55rem + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 60; /* above the navbar (50) */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  pointer-events: none; /* never blocks page flips / clicks */
  user-select: none;
  white-space: nowrap;
  transition: color 0.3s, background 0.3s, border-color 0.3s;

  .cookie { font-size: 0.95rem; }
  .time { font-variant-numeric: tabular-nums; min-width: 3.4em; text-align: center; }
  .label {
    font-size: 0.58rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.6;
    font-weight: 600;
  }

  ${({ $urgent }) => $urgent && css`
    color: #ff5a5f;
    border-color: rgba(255, 90, 95, 0.5);
    background: rgba(40, 0, 0, 0.6);
  `}
`;

// Fixed countdown pill, top-center. Visible only while the 1h window is live;
// hidden before the player starts and once it expires (Phase 2 shows the
// "time's up" summary in the HUD).
export default function CookieTimerBar() {
  const { enabled, started, expired, remainingMs } = useCookieGame();
  if (!enabled || !started || expired) return null;

  const urgent = remainingMs <= URGENT_MS;
  return (
    <Bar
      $urgent={urgent}
      role="timer"
      aria-label={`Cookie game — ${formatMMSS(remainingMs)} left`}
    >
      <span className="cookie" aria-hidden>🍪</span>
      <span className="time">{formatMMSS(remainingMs)}</span>
      <span className="label">left</span>
    </Bar>
  );
}
