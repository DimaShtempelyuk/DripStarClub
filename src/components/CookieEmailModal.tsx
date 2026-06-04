'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useCookieGame } from '@/context/CookieGameContext';
import { COOKIE_GAME } from '@/lib/cookieGame';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const popIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.66);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  animation: ${fadeIn} 0.2s ease;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  padding: 1.8rem 1.7rem 1.6rem;
  background: radial-gradient(ellipse at 50% 0%, #241a0a 0%, #140e06 60%, #0c0904 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  color: #fff;
  animation: ${popIn} 0.28s cubic-bezier(0.2, 0, 0.2, 1);
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const Eyebrow = styled.div`
  font-size: 0.62rem; letter-spacing: 0.24em; text-transform: uppercase;
  color: #ffcf6b; margin-bottom: 0.7rem;
`;
const Title = styled.h2`
  font-size: clamp(1.3rem, 4vw, 1.7rem); font-weight: 800; line-height: 1.1; margin-bottom: 0.7rem;
`;
const Body = styled.p`
  font-size: 0.85rem; line-height: 1.55; color: rgba(255, 255, 255, 0.72); margin-bottom: 1.1rem;
  b { color: #ffcf6b; }
`;
const Prize = styled.div`
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.7rem 0.85rem; margin-bottom: 1.2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 207, 107, 0.35);
  background: rgba(255, 207, 107, 0.08);
  font-size: 0.78rem; line-height: 1.3;
  .emoji { font-size: 1.3rem; }
  b { color: #ffcf6b; }
`;
const Field = styled.input`
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 0.9rem;
  font-family: inherit;
  margin-bottom: 0.7rem;
  &::placeholder { color: rgba(255, 255, 255, 0.35); }
  &:focus { outline: none; border-color: #ffcf6b; background: rgba(255, 255, 255, 0.08); }
`;
const Consent = styled.label`
  display: flex; gap: 0.55rem; align-items: flex-start;
  font-size: 0.74rem; line-height: 1.4; color: rgba(255, 255, 255, 0.6);
  cursor: pointer; margin-bottom: 0.4rem;
  input { margin-top: 0.15rem; accent-color: #ffcf6b; cursor: pointer; flex-shrink: 0; }
`;
const ErrorMsg = styled.div`
  font-size: 0.72rem; color: #ff6b6b; margin-bottom: 0.6rem; min-height: 1em;
`;
const Submit = styled.button`
  width: 100%;
  padding: 0.8rem;
  border-radius: 11px;
  border: none;
  background: ${({ disabled }) => (disabled ? 'rgba(255,207,107,0.3)' : '#ffcf6b')};
  color: #1a1206;
  font-size: 0.82rem; font-weight: 800; letter-spacing: 0.04em;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.2s, transform 0.05s;
  &:hover:not(:disabled) { background: #ffd980; }
  &:active:not(:disabled) { transform: translateY(1px); }
`;
const Later = styled.button`
  display: block; width: 100%; margin-top: 0.7rem;
  background: none; border: none; color: rgba(255, 255, 255, 0.4);
  font-size: 0.72rem; cursor: pointer;
  &:hover { color: rgba(255, 255, 255, 0.7); }
`;
const Code = styled.div`
  margin: 0.4rem 0 1rem; padding: 0.75rem; text-align: center;
  border-radius: 11px; border: 1px dashed rgba(255, 207, 107, 0.5); background: rgba(255, 207, 107, 0.08);
  font-size: 1.1rem; font-weight: 800; letter-spacing: 0.22em; color: #ffcf6b;
`;

export default function CookieEmailModal() {
  const { shouldPromptEmail, emailPromptRequest, submitEmail, markEmailPrompted } = useCookieGame();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'form' | 'success'>('form');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dismiss = useCallback(() => {
    markEmailPrompted();
    setOpen(false);
  }, [markEmailPrompted]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) { setError('Please enter a valid email.'); return; }
    if (!consent) { setError('Tick the box so we can reach you about the game.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await fetch('/api/cookie-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, consent }),
      });
    } catch { /* best-effort — we still store locally */ }
    submitEmail(value, consent); // persists email + marks prompted (closes the gate)
    setSubmitting(false);
    setPhase('success');
  }, [email, consent, submitEmail]);

  // auto-open the first time the gate is crossed
  useEffect(() => { if (shouldPromptEmail) { setPhase('form'); setOpen(true); } }, [shouldPromptEmail]);
  // manual reopen (e.g. from the pending reward card)
  useEffect(() => { if (emailPromptRequest > 0) { setPhase('form'); setOpen(true); } }, [emailPromptRequest]);

  // focus the input + ESC-to-dismiss while open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [open, dismiss]);

  if (!open) return null;

  const [m1] = COOKIE_GAME.milestones;
  const valid = EMAIL_RE.test(email.trim()) && consent;

  return (
    <Backdrop onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <Card role="dialog" aria-modal="true" aria-label="Claim your cookie game reward">
        {phase === 'form' ? (
          <form onSubmit={onSubmit}>
            <Eyebrow>🍪 Reward unlocked</Eyebrow>
            <Title>You hit {m1?.threshold}! Lock in your rewards.</Title>
            <Body>
              Drop your email to claim your <b>5% code</b> and enter the draw. Keep circling to
              unlock the mystery add-in — and the grand prize:
            </Body>
            <Prize>
              <span className="emoji" aria-hidden>📖</span>
              <span>A <b>printed copy of this magazine</b>, shipped free with your order.</span>
            </Prize>
            <Field
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <Consent>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>Email me about the drop &amp; this game so I can win.</span>
            </Consent>
            <ErrorMsg>{error}</ErrorMsg>
            <Submit type="submit" disabled={!valid || submitting}>
              {submitting ? 'Claiming…' : 'Claim my 5% + enter'}
            </Submit>
            <Later type="button" onClick={dismiss}>Maybe later</Later>
          </form>
        ) : (
          <div>
            <Eyebrow>🎉 You&apos;re in</Eyebrow>
            <Title>Reward claimed!</Title>
            <Body>Here&apos;s your <b>5% off</b> code — keep it for checkout:</Body>
            <Code>{COOKIE_GAME.discountCode}</Code>
            <Submit type="button" onClick={() => setOpen(false)}>Keep circling →</Submit>
          </div>
        )}
      </Card>
    </Backdrop>
  );
}
