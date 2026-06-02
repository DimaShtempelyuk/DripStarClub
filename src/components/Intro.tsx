'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: radial-gradient(ellipse at 60% 30%, #ffd6e8 0%, #ffb3d1 35%, #f8e1ec 70%, #fff0f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Card = styled(motion.div)`
  max-width: 460px;
  width: 100%;
  text-align: center;
  color: #1a0010;
`;

const Kicker = styled.span`
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(120, 20, 60, 0.55);
  display: block;
  margin-bottom: 0.6rem;
`;

const Logo = styled.h1`
  font-size: clamp(2rem, 7vw, 3rem);
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 1.75rem;
`;

const Steps = styled.ul`
  list-style: none;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin-bottom: 2rem;
`;

const Step = styled.li`
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;

  .num {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1.5px solid #c0446a;
    color: #c0446a;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .txt {
    font-size: 0.85rem;
    line-height: 1.5;
    color: rgba(60, 10, 30, 0.85);
  }
  .txt b { color: #1a0010; }
`;

const Game = styled.div`
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(192,68,106,0.25);
  border-radius: 10px;
  padding: 1rem 1.1rem;
  margin-bottom: 2rem;
  font-size: 0.82rem;
  line-height: 1.55;
  color: rgba(60, 10, 30, 0.9);

  .cookie { font-size: 1.4rem; display: block; margin-bottom: 0.35rem; }
  b { color: #c0446a; }
`;

const EnterBtn = styled.button`
  background: #1a0010;
  color: #fff;
  border: none;
  padding: 0.95rem 3rem;
  border-radius: 50px;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, background 0.2s;
  &:hover { background: #3a0020; transform: translateY(-1px); }
`;

const HintPill = styled.button`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 9000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border-radius: 50px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  color: rgba(255,255,255,0.85);
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s;
  &:hover { background: rgba(0,0,0,0.75); }

  .q {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.4);
    font-size: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 600px) {
    .hint-text { display: none; }
    padding: 0.55rem;
  }
`;

export const PRIZE = 'a free tee 👕'; // ← edit the prize here

export default function Intro({ isMobile }: { isMobile: boolean }) {
  // Shown every visit.
  const [open, setOpen] = useState(true);

  const navText = isMobile
    ? 'Swipe left or right to flip pages.'
    : 'Drag a page corner, or use the ‹ › arrows to flip.';

  return (
    <>
      <AnimatePresence>
        {open && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Kicker>Issue 01 — The Drop</Kicker>
              <Logo>Dripstar</Logo>

              <Steps>
                <Step>
                  <span className="num">1</span>
                  <span className="txt"><b>Flip through it.</b> {navText}</span>
                </Step>
                <Step>
                  <span className="num">2</span>
                  <span className="txt"><b>See something you like?</b> Tap it to circle it — that drops it straight into your bag.</span>
                </Step>
                <Step>
                  <span className="num">3</span>
                  <span className="txt"><b>Circle again to add more.</b> Open your bag any time from the top right.</span>
                </Step>
              </Steps>

              <Game>
                <span className="cookie">🍪</span>
                Warm up on the cookie on page one — circle it as many times as you can.
                <b> Most circles wins {PRIZE}.</b>
              </Game>

              <EnterBtn onClick={() => setOpen(false)}>Enter</EnterBtn>
            </Card>
          </Overlay>
        )}
      </AnimatePresence>

      {!open && (
        <HintPill onClick={() => setOpen(true)} aria-label="How it works">
          <span className="q">?</span>
          <span className="hint-text">
            Tap to circle · {isMobile ? 'swipe' : 'arrows'} to flip
          </span>
        </HintPill>
      )}
    </>
  );
}
