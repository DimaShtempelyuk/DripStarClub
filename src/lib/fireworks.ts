// Lightweight DOM fireworks — glowy mixed-shape particles that drift outward,
// spin, and fade. Glow comes from a radial-gradient fill (no per-particle blur
// or box-shadow filters), so it stays cheap. Callers gate reduced-motion.
//
// Pass `parent` to mount the particles inside a specific layer (e.g. one sitting
// *behind* the magazine); omit it to overlay the whole viewport.
export function burstFireworks(
  x: number,
  y: number,
  colors: string[],
  parent?: HTMLElement | null,
): void {
  if (typeof document === 'undefined') return;

  const host = parent ?? document.body;
  const fixed = !parent;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText =
    `position:${fixed ? 'fixed' : 'absolute'};inset:0;pointer-events:none;overflow:hidden;` +
    (fixed ? 'z-index:70;' : '');
  host.appendChild(layer);

  const reach = Math.max(window.innerWidth, window.innerHeight);
  const N = 26;
  const STAR = 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
  const dots: HTMLDivElement[] = [];

  for (let i = 0; i < N; i++) {
    const dot = document.createElement('div');
    const size = 7 + Math.random() * 12;
    const color = colors[i % colors.length] ?? '#fff';
    const isStar = Math.random() < 0.45;
    dot.style.cssText =
      `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
      `margin:${-size / 2}px 0 0 ${-size / 2}px;opacity:0;will-change:transform,opacity;` +
      `background:radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${color} 45%, transparent 72%);` +
      (isStar ? `clip-path:${STAR};` : 'border-radius:50%;');
    layer.appendChild(dot);
    dots.push(dot);
  }

  // Animate next frame (after layout) — the fix for particles that spawn but
  // never "explode".
  requestAnimationFrame(() => {
    for (let i = 0; i < dots.length; i++) {
      const angle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = reach * (0.28 + Math.random() * 0.34);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = (Math.random() * 2 - 1) * 220;
      const dur = 1100 + Math.random() * 900; // slower drift
      dots[i].animate(
        [
          { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.62 },
          { transform: `translate(${dx.toFixed(0)}px, ${(dy + reach * 0.05).toFixed(0)}px) rotate(${rot.toFixed(0)}deg) scale(0.3)`, opacity: 0, offset: 1 },
        ],
        { duration: dur, easing: 'cubic-bezier(0.1,0.6,0.3,1)', fill: 'forwards' },
      );
    }
  });

  setTimeout(() => layer.remove(), 2200); // safely past the slowest particle
}
