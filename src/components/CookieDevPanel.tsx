'use client';

import React from 'react';
import styled from 'styled-components';
import { useCookieGame } from '@/context/CookieGameContext';
import { COOKIE_GAME, formatMMSS } from '@/lib/cookieGame';

const Box = styled.div`
  position: fixed;
  bottom: calc(0.85rem + env(safe-area-inset-bottom));
  right: calc(0.85rem + env(safe-area-inset-right));
  z-index: 55;
  width: 176px;
  padding: 0.6rem 0.7rem 0.7rem;
  border-radius: 12px;
  background: rgba(10, 10, 12, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  user-select: none;

  .hdr {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.54rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: #ffcf6b; margin-bottom: 0.5rem;
  }
  .stat { display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 0.3rem; }
  .stat b { color: #fff; }
  .stat .t { color: rgba(255, 255, 255, 0.6); font-variant-numeric: tabular-nums; }
  .flags { display: flex; gap: 0.6rem; font-size: 0.6rem; margin-bottom: 0.55rem; color: rgba(255, 255, 255, 0.3); }
  .flags .on { color: #34c759; }
  .row { display: flex; gap: 0.3rem; margin-top: 0.3rem; }
`;

const Btn = styled.button`
  flex: 1;
  padding: 0.32rem 0;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 0.66rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.05s;
  &:hover { background: rgba(255, 255, 255, 0.16); border-color: rgba(255, 255, 255, 0.3); }
  &:active { transform: translateY(1px); }
`;

// On-screen testing controls. Rendered globally but no-ops unless devMode is on.
export default function CookieDevPanel() {
  const {
    count, remainingMs, started, expired, rainbowOn, shakeOn, outlineOn,
    devAddCount, devExpire, resetGame,
  } = useCookieGame();

  if (!COOKIE_GAME.devMode) return null;

  const [m1, m2, m3] = COOKIE_GAME.milestones;
  const jumpTo = (n: number) => devAddCount(n - count);

  return (
    <Box>
      <div className="hdr"><span>dev · cookie game</span><span>🍪</span></div>
      <div className="stat">
        <span>count&nbsp;<b>{count}</b></span>
        <span className="t">{expired ? 'expired' : started ? formatMMSS(remainingMs) : 'idle'}</span>
      </div>
      <div className="flags">
        <span className={rainbowOn ? 'on' : ''}>🌈@{COOKIE_GAME.rainbowAfter}</span>
        <span className={shakeOn ? 'on' : ''}>📳@{COOKIE_GAME.shakeAfter}</span>
        <span className={outlineOn ? 'on' : ''}>✨@{COOKIE_GAME.rainbowOutlineAt}</span>
      </div>
      <div className="row">
        <Btn onClick={() => devAddCount(-10)}>−10</Btn>
        <Btn onClick={() => devAddCount(-1)}>−1</Btn>
        <Btn onClick={() => devAddCount(1)}>+1</Btn>
        <Btn onClick={() => devAddCount(10)}>+10</Btn>
      </div>
      <div className="row">
        {m1 && <Btn onClick={() => jumpTo(m1.threshold)}>→{m1.threshold}</Btn>}
        {m2 && <Btn onClick={() => jumpTo(m2.threshold)}>→{m2.threshold}</Btn>}
        <Btn onClick={() => jumpTo(COOKIE_GAME.rainbowOutlineAt)}>→{COOKIE_GAME.rainbowOutlineAt}</Btn>
        {m3 && <Btn onClick={() => jumpTo(m3.threshold)}>→{m3.threshold}</Btn>}
      </div>
      <div className="row">
        <Btn onClick={resetGame}>reset</Btn>
        <Btn onClick={devExpire}>expire</Btn>
      </div>
    </Box>
  );
}
