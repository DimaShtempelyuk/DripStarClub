'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Rough, hand-drawn circle centred in a local px coordinate box.
function roughCirclePath(cx: number, cy: number, rx: number, ry: number) {
  const w = rx * 0.16;
  const h = ry * 0.16;
  return `
    M ${cx + rx + w},${cy + h}
    C ${cx + rx},${cy - ry * 0.5}
      ${cx + rx * 0.5 + w},${cy - ry - h}
      ${cx - w},${cy - ry}
    C ${cx - rx * 0.5},${cy - ry + h}
      ${cx - rx - w},${cy - ry * 0.5 + h}
      ${cx - rx},${cy + h}
    C ${cx - rx},${cy + ry * 0.5}
      ${cx - rx * 0.5 - w},${cy + ry + h}
      ${cx + w},${cy + ry}
    C ${cx + rx * 0.5},${cy + ry - h}
      ${cx + rx + w},${cy + ry * 0.5}
      ${cx + rx + w},${cy + h}
  `.trim();
}

interface Props {
  /** viewport x of the click */
  x: number;
  /** viewport y of the click */
  y: number;
  /** circle radius in px */
  radius: number;
}

export default function CrayonCircle({ x, y, radius }: Props) {
  const size = radius * 2.9;
  const cx = size / 2;
  const cy = size / 2;
  const rx = radius;
  const ry = radius * 1.04;

  const d1 = roughCirclePath(cx, cy, rx, ry);
  const d2 = roughCirclePath(cx + 2, cy + 1.5, rx + 3, ry + 2);
  const d3 = roughCirclePath(cx - 1.5, cy + 1, rx + 1.5, ry + 1);

  const main = Math.max(3.2, radius * 0.035);
  const ease = [0.4, 0, 0.2, 1] as const;

  return (
    <motion.svg
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: 'fixed',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 95,
        overflow: 'visible',
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <defs>
        <filter id="crayon-noise" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* shadow pass */}
      <motion.path
        d={d2}
        fill="none"
        stroke="rgba(150,0,0,0.28)"
        strokeWidth={main * 1.6}
        strokeLinecap="round"
        filter="url(#crayon-noise)"
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
        filter="url(#crayon-noise)"
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
        filter="url(#crayon-noise)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.67, ease, delay: 0.06 }}
      />
    </motion.svg>
  );
}
