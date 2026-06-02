'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Percentage-based viewBox (0–100 × 0–100) so the circle always
// scales correctly regardless of actual page pixel dimensions.
function roughCirclePath(cx: number, cy: number, rx: number, ry: number) {
  const w = rx * 0.18;
  const h = ry * 0.18;
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

// Circle centred at 50,44 — covers most of the page
const CX = 50, CY = 44, RX = 36, RY = 36;

const d1 = roughCirclePath(CX, CY, RX, RY);
const d2 = roughCirclePath(CX + 0.6, CY + 0.4, RX + 0.8, RY + 0.6);
const d3 = roughCirclePath(CX - 0.4, CY + 0.2, RX + 0.4, RY + 0.2);

const ease = [0.4, 0, 0.2, 1] as const;

interface Props {
  visible: boolean;
}

export default function CrayonCircle({ visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.svg
          key="crayon"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
            overflow: 'visible',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <defs>
            <filter id="crayon-noise" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* shadow */}
          <motion.path
            d={d2}
            fill="none"
            stroke="rgba(160,0,0,0.25)"
            strokeWidth={1.4}
            strokeLinecap="round"
            filter="url(#crayon-noise)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.68, ease, delay: 0.04 }}
          />

          {/* main stroke */}
          <motion.path
            d={d1}
            fill="none"
            stroke="#e00"
            strokeWidth={0.9}
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
            strokeWidth={0.45}
            strokeLinecap="round"
            filter="url(#crayon-noise)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.67, ease, delay: 0.06 }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}
