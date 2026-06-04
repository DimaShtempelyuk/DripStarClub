'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Deterministic PRNG so a circle's wobble stays identical across re-renders.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth wobbly closed loop built from jittered points joined by quadratic
// curves through their midpoints. No SVG filter (filters have a Chrome
// paint-timing bug); the crayon character comes from the path itself.
function wobblyPath(rng: () => number, cx: number, cy: number, rx: number, ry: number, points: number, jitter: number) {
  const pts: [number, number][] = [];
  const startAngle = rng() * Math.PI * 2;
  for (let i = 0; i < points; i++) {
    const a = startAngle + (i / points) * Math.PI * 2;
    const jr = 1 + (rng() * 2 - 1) * jitter;
    pts.push([cx + Math.cos(a) * rx * jr, cy + Math.sin(a) * ry * jr]);
  }
  const mid = (p: [number, number], q: [number, number]): [number, number] => [
    (p[0] + q[0]) / 2,
    (p[1] + q[1]) / 2,
  ];
  const n = pts.length;
  const s = mid(pts[n - 1], pts[0]);
  let d = `M ${s[0].toFixed(1)} ${s[1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const m = mid(cur, next);
    d += `Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)} `;
  }
  return d + 'Z';
}

// hex (#rgb / #rrggbb) → rgba() so rainbow strokes can reuse one hue at
// different opacities. Falls back to the input on anything unexpected.
function withAlpha(hex: string, a: number): string {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

interface Props {
  /** box size in px (diameter of the wrapper); SVG fills it */
  size: number;
  /** stable seed for the wobble shape */
  seed: number;
  /** override hue (rainbow mode). When set, all 3 strokes derive from it. */
  color?: string;
}

export default function CrayonCircle({ size, seed, color }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  const { d1, d2, d3 } = useMemo(() => {
    const rng = mulberry32(seed);
    return {
      d1: wobblyPath(rng, cx, cy, r, r * 1.04, 12, 0.06),
      d2: wobblyPath(rng, cx + size * 0.01, cy + size * 0.008, r * 1.05, r * 1.08, 12, 0.07),
      d3: wobblyPath(rng, cx - size * 0.008, cy + size * 0.005, r * 1.02, r * 1.03, 12, 0.055),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, size]);

  const main = Math.max(3, size * 0.014);
  const ease = [0.4, 0, 0.2, 1] as const;

  // crayon reds by default; in rainbow mode all three strokes share `color`.
  const strokeShadow = color ? withAlpha(color, 0.3) : 'rgba(150,0,0,0.28)';
  const strokeMain = color ?? '#e00';
  const strokeHi = color ? withAlpha(color, 0.5) : 'rgba(220,0,0,0.4)';

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <motion.path
        d={d2}
        fill="none"
        stroke={strokeShadow}
        strokeWidth={main * 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.68, ease, delay: 0.04 }}
      />
      <motion.path
        d={d1}
        fill="none"
        stroke={strokeMain}
        strokeWidth={main}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.65, ease }}
      />
      <motion.path
        d={d3}
        fill="none"
        stroke={strokeHi}
        strokeWidth={main * 0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.67, ease, delay: 0.06 }}
      />
    </svg>
  );
}
