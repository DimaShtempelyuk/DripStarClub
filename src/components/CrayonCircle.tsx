'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

// Build a smooth, wobbly closed loop by sampling jittered points around an
// ellipse and joining them with quadratic curves through their midpoints.
function wobblyPath(cx: number, cy: number, rx: number, ry: number, points: number, jitter: number) {
  const pts: [number, number][] = [];
  const startAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < points; i++) {
    const a = startAngle + (i / points) * Math.PI * 2;
    const jr = 1 + (Math.random() * 2 - 1) * jitter;
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

interface Props {
  x: number;
  y: number;
  radius: number;
}

export default function CrayonCircle({ x, y, radius }: Props) {
  // Portal target — only mount on client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const size = radius * 2.9;
  const cx = size / 2;
  const cy = size / 2;
  const rx = radius;
  const ry = radius * 1.04;

  const { d1, d2, d3 } = useMemo(() => ({
    d1: wobblyPath(cx, cy, rx, ry, 12, 0.06),
    d2: wobblyPath(cx + 2, cy + 1.5, rx + 3, ry + 2, 12, 0.07),
    d3: wobblyPath(cx - 1.5, cy + 1, rx + 1.5, ry + 1, 12, 0.055),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [size]);

  const main = Math.max(3.2, radius * 0.04);
  const ease = [0.4, 0, 0.2, 1] as const;

  if (!mounted) return null;

  const svg = (
    <motion.svg
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: 'fixed',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 9998,
        overflow: 'visible',
      }}
      // fade the whole thing out near the end of its life
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: 1.6, times: [0, 0.55, 1], ease: 'easeOut' }}
    >
      {/* shadow pass */}
      <motion.path
        d={d2}
        fill="none"
        stroke="rgba(150,0,0,0.28)"
        strokeWidth={main * 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.68, ease, delay: 0.04 }}
      />
      {/* main red crayon */}
      <motion.path
        d={d1}
        fill="none"
        stroke="#e00"
        strokeWidth={main}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.65, ease }}
      />
      {/* texture pass */}
      <motion.path
        d={d3}
        fill="none"
        stroke="rgba(220,0,0,0.4)"
        strokeWidth={main * 0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.67, ease, delay: 0.06 }}
      />
    </motion.svg>
  );

  return createPortal(svg, document.body);
}
