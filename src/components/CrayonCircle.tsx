'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function roughCirclePath(cx: number, cy: number, rx: number, ry: number) {
  const w = rx * 0.18;
  const h = ry * 0.18;
  return `
    M ${cx + rx + w},${cy + h}
    C ${cx + rx},${cy - ry * 0.5},
      ${cx + rx * 0.5 + w},${cy - ry - h},
      ${cx - w},${cy - ry}
    C ${cx - rx * 0.5},${cy - ry + h},
      ${cx - rx - w},${cy - ry * 0.5 + h},
      ${cx - rx},${cy + h}
    C ${cx - rx},${cy + ry * 0.5},
      ${cx - rx * 0.5 - w},${cy + ry + h},
      ${cx + w},${cy + ry}
    C ${cx + rx * 0.5},${cy + ry - h},
      ${cx + rx + w},${cy + ry * 0.5},
      ${cx + rx + w},${cy + h}
  `.trim();
}

interface Props {
  visible: boolean;
  containerWidth: number;
  containerHeight: number;
}

export default function CrayonCircle({ visible, containerWidth, containerHeight }: Props) {
  const cx = containerWidth * 0.5;
  const cy = containerHeight * 0.44;
  const rx = containerWidth * 0.36;
  const ry = containerHeight * 0.38;

  const d1 = roughCirclePath(cx, cy, rx, ry);
  const d2 = roughCirclePath(cx + 3, cy + 2, rx + 4, ry + 3);
  const d3 = roughCirclePath(cx - 2, cy + 1, rx + 2, ry + 1);

  const ease = [0.4, 0, 0.2, 1] as const;
  const dur = 0.65;

  return (
    <AnimatePresence>
      {visible && (
        <motion.svg
          key="crayon"
          viewBox={`0 0 ${containerWidth} ${containerHeight}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <defs>
            <filter id="crayon-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* shadow */}
          <motion.path
            d={d2}
            fill="none"
            stroke="rgba(180,0,0,0.3)"
            strokeWidth={7}
            strokeLinecap="round"
            filter="url(#crayon-noise)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: dur, ease, delay: 0.04 }}
          />

          {/* main red stroke */}
          <motion.path
            d={d1}
            fill="none"
            stroke="#e00"
            strokeWidth={4.5}
            strokeLinecap="round"
            filter="url(#crayon-noise)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: dur, ease }}
          />

          {/* texture pass */}
          <motion.path
            d={d3}
            fill="none"
            stroke="rgba(220,0,0,0.45)"
            strokeWidth={2}
            strokeLinecap="round"
            filter="url(#crayon-noise)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: dur, ease, delay: 0.06 }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}
