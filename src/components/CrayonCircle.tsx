'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeOut = keyframes`
  0%   { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; }
`;

const Svg = styled.svg<{ $fading: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  animation: ${({ $fading }) => $fading ? fadeOut : 'none'} 1s ease forwards;
`;

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
  fading: boolean;
  containerWidth: number;
  containerHeight: number;
}

export default function CrayonCircle({ visible, fading, containerWidth, containerHeight }: Props) {
  const cx = containerWidth * 0.5;
  const cy = containerHeight * 0.44;
  const rx = containerWidth * 0.36;
  const ry = containerHeight * 0.38;

  if (!visible) return null;

  const d1 = roughCirclePath(cx, cy, rx, ry);
  const d2 = roughCirclePath(cx + 3, cy + 2, rx + 4, ry + 3);
  const d3 = roughCirclePath(cx - 2, cy + 1, rx + 2, ry + 1);

  // Inject keyframes as a plain <style> tag — avoids styled-components untagged interpolation error
  const animStyles = `
    @keyframes dripstar-draw {
      to { stroke-dashoffset: 0; }
    }
  `;

  return (
    <Svg viewBox={`0 0 ${containerWidth} ${containerHeight}`} $fading={fading}>
      <defs>
        <style>{animStyles}</style>
        <filter id="crayon-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* shadow */}
      <path
        d={d2}
        fill="none"
        stroke="rgba(180,0,0,0.25)"
        strokeWidth="7"
        strokeLinecap="round"
        filter="url(#crayon-noise)"
        style={{
          strokeDasharray: 9999,
          strokeDashoffset: 9999,
          animation: 'dripstar-draw 0.75s cubic-bezier(0.4,0,0.2,1) 0.04s forwards',
        }}
      />

      {/* main stroke */}
      <path
        d={d1}
        fill="none"
        stroke="#e00"
        strokeWidth="4.5"
        strokeLinecap="round"
        filter="url(#crayon-noise)"
        style={{
          strokeDasharray: 9999,
          strokeDashoffset: 9999,
          animation: 'dripstar-draw 0.7s cubic-bezier(0.4,0,0.2,1) forwards',
        }}
      />

      {/* texture pass */}
      <path
        d={d3}
        fill="none"
        stroke="rgba(220,0,0,0.45)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#crayon-noise)"
        style={{
          strokeDasharray: 9999,
          strokeDashoffset: 9999,
          animation: 'dripstar-draw 0.72s cubic-bezier(0.4,0,0.2,1) 0.06s forwards',
        }}
      />
    </Svg>
  );
}
