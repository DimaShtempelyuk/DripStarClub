'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─── Roaming images ───────────────────────────────────────────────────────────
// Your creative knobs. Drop art in /public and point `src` here; `size` is the
// on-screen width in px on desktop (auto-scales down on phones). Add or remove
// entries freely — the physics adapts to however many you list.
const ROAMERS: { src: string; size: number }[] = [
  { src: '/roamer-1.png', size: 180 },
  { src: '/roamer-2.png', size: 180 },
];

const BASE_SPEED = 95;      // px/s — calm drift (medium)
const MAX_THROW = 1900;     // px/s — cap when you fling one, so it can't rocket off
const SPIN = 10;            // deg/s — gentle rotation while drifting
const MOBILE_BP = 768;
// Per-platform scaling (size and speed are independent)
const SPEED_SCALE_DESKTOP = 1.3; // 30% faster on PC
const SPEED_SCALE_MOBILE = 0.62; // calmer drift on phones
const SIZE_SCALE_MOBILE = 0.7;   // 30% smaller on phones

interface RoamerState {
  x: number; y: number; vx: number; vy: number; rot: number; size: number;
  grabbed: boolean; gdx: number; gdy: number; lastT: number;
}

export default function FloatingRoamers() {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const st = useRef<RoamerState[]>([]);
  const baseSpeed = useRef(BASE_SPEED);
  const raf = useRef(0);

  // mount + watch the OS "reduce motion" preference
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // init positions/velocities + run the physics loop (skipped when reduced)
  useEffect(() => {
    if (!mounted) return;
    const isMobile = window.innerWidth < MOBILE_BP;
    const sizeScale = isMobile ? SIZE_SCALE_MOBILE : 1;
    const speed = BASE_SPEED * (isMobile ? SPEED_SCALE_MOBILE : SPEED_SCALE_DESKTOP);
    baseSpeed.current = speed;

    st.current = ROAMERS.map((r) => {
      const size = r.size * sizeScale;
      const a = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * Math.max(1, window.innerWidth - size),
        y: Math.random() * Math.max(1, window.innerHeight - size),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        rot: Math.random() * 360,
        size,
        grabbed: false, gdx: 0, gdy: 0, lastT: 0,
      };
    });
    st.current.forEach((s, i) => {
      const n = nodes.current[i];
      if (n) {
        n.style.width = `${s.size}px`;
        n.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
      }
    });

    if (reduced) return; // freeze in place for reduce-motion users

    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const base = baseSpeed.current;

      for (let i = 0; i < st.current.length; i++) {
        const s = st.current[i];
        const n = nodes.current[i];
        if (!n || s.grabbed) continue;

        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // soft bounce off the viewport edges
        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
        else if (s.x >= W - s.size) { s.x = W - s.size; s.vx = -Math.abs(s.vx); }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
        else if (s.y >= H - s.size) { s.y = H - s.size; s.vy = -Math.abs(s.vy); }

        // ease a thrown roamer back down to the calm drift speed
        const sp = Math.hypot(s.vx, s.vy) || 1;
        if (sp > base) {
          const next = Math.max(base, sp - (sp - base) * Math.min(1, dt * 1.2));
          const k = next / sp; s.vx *= k; s.vy *= k;
        } else if (sp < base * 0.6) {
          const k = (base * 0.6) / sp; s.vx *= k; s.vy *= k;
        }

        s.rot += SPIN * dt * (s.vx >= 0 ? 1 : -1);
        n.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [mounted, reduced]);

  // ── Catch & launch ──────────────────────────────────────────────────────────
  const onDown = useCallback((i: number) => (e: React.PointerEvent) => {
    const s = st.current[i];
    if (!s) return;
    s.grabbed = true;
    s.gdx = e.clientX - s.x;
    s.gdy = e.clientY - s.y;
    s.lastT = performance.now();
    s.vx = 0; s.vy = 0;
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }, []);

  const onMove = useCallback((i: number) => (e: React.PointerEvent) => {
    const s = st.current[i];
    if (!s || !s.grabbed) return;
    const nx = e.clientX - s.gdx;
    const ny = e.clientY - s.gdy;
    const now = performance.now();
    const dt = Math.max(0.001, (now - s.lastT) / 1000);
    s.vx = (nx - s.x) / dt; // track flick velocity
    s.vy = (ny - s.y) / dt;
    s.x = nx; s.y = ny; s.lastT = now;
    const n = nodes.current[i];
    if (n) n.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
  }, []);

  const onUp = useCallback((i: number) => (e: React.PointerEvent) => {
    const s = st.current[i];
    if (!s) return;
    s.grabbed = false;
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > MAX_THROW) { const k = MAX_THROW / sp; s.vx *= k; s.vy *= k; }
    if (sp < 30) { // released without a real flick — nudge it back into a drift
      const a = Math.random() * Math.PI * 2;
      s.vx = Math.cos(a) * baseSpeed.current;
      s.vy = Math.sin(a) * baseSpeed.current;
    }
    (e.currentTarget as HTMLElement).style.cursor = 'grab';
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  }, []);

  if (!mounted) return null;

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 60, pointerEvents: 'none', overflow: 'hidden' }}>
      {ROAMERS.map((r, i) => (
        <div
          key={i}
          ref={(el) => { nodes.current[i] = el; }}
          onPointerDown={reduced ? undefined : onDown(i)}
          onPointerMove={reduced ? undefined : onMove(i)}
          onPointerUp={reduced ? undefined : onUp(i)}
          onPointerCancel={reduced ? undefined : onUp(i)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: reduced ? 'none' : 'auto', // catchable (unless reduced)
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            willChange: 'transform',
          }}
        >
          <img
            src={r.src}
            alt=""
            draggable={false}
            style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
          />
        </div>
      ))}
    </div>
  );
}
