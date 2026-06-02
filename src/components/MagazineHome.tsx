'use client';

import React, { useEffect, useRef, useState, forwardRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import styled, { keyframes, css } from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/shopify';
import { useCart, COOKIE_ID } from '@/context/CartContext';
import CrayonCircle from './CrayonCircle';

export const PRIZE = 'a free tee 👕'; // ← edit the prize here

// ─── Wrapper ──────────────────────────────────────────────────────────────────

const Stage = styled.div`
  height: 100svh;
  width: 100%;
  background: radial-gradient(ellipse at 60% 30%, #ffd6e8 0%, #ffb3d1 30%, #f8e1ec 60%, #fff0f6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  /* floor reflection glow */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 160px;
    background: radial-gradient(ellipse at center, rgba(255,182,210,0.25) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const BookWrap = styled.div`
  position: relative; /* anchors the on-book nav zones */
  /* drop shadow under the open book */
  filter: drop-shadow(0 50px 100px rgba(0,0,0,1)) drop-shadow(0 10px 30px rgba(0,0,0,0.8));
`;

// ─── Nav arrows ───────────────────────────────────────────────────────────────

const NavBtn = styled.button<{ $side: 'left' | 'right'; $hidden: boolean }>`
  position: absolute;
  /* leave the top/bottom corners free so corner-swipe still works */
  top: 16%;
  bottom: 16%;
  ${({ $side }) => $side === 'left' ? 'left: 0;' : 'right: 0;'}
  width: clamp(44px, 13%, 100px);
  z-index: 30;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  ${({ $side }) => $side === 'left' ? 'justify-content: flex-start; padding-left: 0.6rem;' : 'justify-content: flex-end; padding-right: 0.6rem;'}
  font-size: clamp(1.6rem, 3vw, 2.6rem);
  color: rgba(255,255,255,0.5);
  -webkit-tap-highlight-color: transparent;
  transition: color 0.2s, background 0.2s, opacity 0.15s;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  pointer-events: ${({ $hidden }) => ($hidden ? 'none' : 'auto')};
  background: ${({ $side }) => $side === 'left'
    ? 'linear-gradient(to right, rgba(20,20,20,0.4), rgba(20,20,20,0.05) 75%, transparent)'
    : 'linear-gradient(to left, rgba(20,20,20,0.4), rgba(20,20,20,0.05) 75%, transparent)'};

  &:hover {
    color: #fff;
    background: ${({ $side }) => $side === 'left'
      ? 'linear-gradient(to right, rgba(0,0,0,0.62), rgba(0,0,0,0.12) 75%, transparent)'
      : 'linear-gradient(to left, rgba(0,0,0,0.62), rgba(0,0,0,0.12) 75%, transparent)'};
  }
`;

const PageCounter = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: rgba(180,80,120,0.5);
  text-transform: uppercase;
`;

// ─── Page base styles ─────────────────────────────────────────────────────────

const PageRoot = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #080808;
  position: relative;
  user-select: none;

  /* page edge crease line on the spine side */
  &.--left  { border-right: 1px solid rgba(255,255,255,0.04); }
  &.--right { border-left:  1px solid rgba(255,255,255,0.04); }
`;

// ─── Editorial page ───────────────────────────────────────────────────────────

const EdBg = styled.div<{ $gradient: string }>`
  position: absolute;
  inset: 0;
  background: ${({ $gradient }) => $gradient};
`;

const EdImg = styled(Image)`
  object-fit: cover;
`;

const EdOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%);
`;

const EdContent = styled.div`
  position: absolute;
  bottom: 12%;
  left: 10%;
  right: 10%;
  z-index: 2;
`;

const EdLabel = styled.span`
  font-size: 0.65rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  display: block;
  margin-bottom: 0.75rem;
`;

const EdHeadline = styled.h2`
  font-size: clamp(1.8rem, 4vw, 3.5rem);
  font-weight: 800;
  line-height: 1.0;
  color: #fff;
  white-space: pre-line;
  margin-bottom: 1rem;
`;

const EdBody = styled.p`
  font-size: 0.82rem;
  line-height: 1.65;
  color: rgba(255,255,255,0.65);
  max-width: 340px;
`;

// ─── Product page ─────────────────────────────────────────────────────────────

const ProdImgWrap = styled.div`
  position: absolute;
  inset: 0;
  background: #080808;
`;

const ProdInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem 1.75rem 2rem;
  background: linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent);
  z-index: 2;
`;

const ProdLabel = styled.span`
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
  display: block;
  margin-bottom: 0.4rem;
`;

const ProdTitle = styled.h3`
  font-size: clamp(1rem, 2.5vw, 1.6rem);
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.4rem;
  line-height: 1.15;
`;

const ProdPrice = styled.span`
  font-size: 0.85rem;
  color: rgba(255,255,255,0.6);
  display: block;
  margin-bottom: 0.75rem;
`;

const circlePulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(220,0,0,0.8); }
  70%  { box-shadow: 0 0 0 12px rgba(220,0,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(220,0,0,0); }
`;

const AddBtn = styled.button<{ $active?: boolean }>`
  padding: 0.55rem 1.4rem;
  border-radius: 50px;
  border: 1.5px solid rgba(255,255,255,0.7);
  background: transparent;
  color: #fff;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  ${({ $active }) => $active && css`
    border-color: #e00;
    animation: ${circlePulse} 0.85s ease-out;
  `}
  &:hover { background: #fff; color: #000; }
`;

const ViewLink = styled(Link)`
  display: block;
  margin-top: 0.5rem;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  text-decoration: none;
  &:hover { color: #fff; }
`;

// ─── Page components (must use forwardRef for react-pageflip) ─────────────────

const EditorialFlipPage = forwardRef<HTMLDivElement, {
  label: string;
  headline: string;
  body?: string;
  gradient: string;
  imageSrc?: string;
  side?: 'left' | 'right';
}>(({ label, headline, body, gradient, imageSrc, side }, ref) => (
  <PageRoot ref={ref} className={side === 'left' ? '--left' : '--right'}>
    <EdBg $gradient={gradient}>
      {imageSrc && <EdImg src={imageSrc} alt="" fill sizes="50vw" priority />}
    </EdBg>
    <EdOverlay />
    <EdContent>
      <EdLabel>{label}</EdLabel>
      <EdHeadline>{headline}</EdHeadline>
      {body && <EdBody>{body}</EdBody>}
    </EdContent>
  </PageRoot>
));
EditorialFlipPage.displayName = 'EditorialFlipPage';

const ClickHint = styled.div<{ $hidden: boolean }>`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  white-space: nowrap;
  z-index: 3;
  transition: opacity 0.3s;
  opacity: ${({ $hidden }) => $hidden ? 0 : 1};
  pointer-events: none;
`;

// Burst-repaint a node for `ms` whenever `dep` changes — defeats the Chrome
// compositing bug where dynamically-added content in a transformed/filtered
// layer (react-pageflip pages) doesn't paint until a reflow.
function useRepaintBurst(ref: React.RefObject<HTMLElement | null>, dep: number, ms = 800) {
  useEffect(() => {
    const el = ref.current;
    if (!el || dep === 0) return;
    const start = performance.now();
    let raf = 0;
    let on = false;
    const tick = (t: number) => {
      const node = ref.current;
      if (!node) return;
      on = !on;
      node.style.opacity = on ? '0.999' : '1';
      if (t - start < ms) raf = requestAnimationFrame(tick);
      else node.style.opacity = '1';
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
}

interface ClickPoint { x: number; y: number; rect: DOMRect }

// Only fire `onClickAt` for a genuine click/tap. Skip when:
//  - the pointer moved (a swipe/drag to flip), or
//  - a page flip is happening (e.g. a corner click that turns the page).
// A corner click registers the flip slightly AFTER the click event, so we
// defer briefly and re-check the flip state before circling.
function usePageClick(onClickAt: (p: ClickPoint) => void, isFlipping?: () => boolean) {
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const d = down.current;
    down.current = null;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return; // swipe
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    window.setTimeout(() => {
      if (isFlipping?.()) return; // a flip started — this was a page turn, not a circle
      onClickAt({ x, y, rect });
    }, 80);
  }, [onClickAt, isFlipping]);
  return { onPointerDown, onClick };
}

const CircleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
`;

const CircleAnchor = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
`;

const ProductFlipPage = forwardRef<HTMLDivElement, {
  product: Product;
  side?: 'left' | 'right';
  pageWidth: number;
  pageHeight: number;
  flipGuard?: () => boolean;
}>(({ product, side, pageWidth, flipGuard }, ref) => {
  const { addCircle, circles } = useCart();
  const variant = product.variants.nodes[0];
  const layerRef = useRef<HTMLDivElement>(null);

  const mine = circles.filter((c) => c.productId === product.id);
  useRepaintBurst(layerRef, mine.length);

  const { onPointerDown, onClick } = usePageClick(useCallback(({ x, y, rect }) => {
    if (!variant) return;
    const xPct = (x - rect.left) / rect.width;
    const yPct = (y - rect.top) / rect.height;
    addCircle({ productId: product.id, variantId: variant.id, xPct, yPct, rPct: 0.3 });
  }, [variant, product.id, addCircle]), flipGuard);

  return (
    <PageRoot ref={ref} className={side === 'left' ? '--left' : '--right'}
      style={{ cursor: 'crosshair' }} onPointerDown={onPointerDown} onClick={onClick}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <ProdImgWrap>
          {product.featuredImage && (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="50vw"
            />
          )}
        </ProdImgWrap>

        <CircleLayer ref={layerRef}>
          {mine.map((c) => (
            <CircleAnchor
              key={c.circleId}
              style={{ left: `${c.xPct * 100}%`, top: `${c.yPct * 100}%` }}
            >
              <CrayonCircle size={c.rPct * pageWidth * 2} seed={c.seed} />
            </CircleAnchor>
          ))}
        </CircleLayer>

        <ProdInfo>
          <ProdLabel>New drop</ProdLabel>
          <ProdTitle>{product.title}</ProdTitle>
          <ProdPrice>
            {product.priceRange.minVariantPrice.currencyCode} {product.priceRange.minVariantPrice.amount}
          </ProdPrice>
          <ViewLink href={`/products/${product.handle}`} onClick={e => e.stopPropagation()}>View →</ViewLink>
        </ProdInfo>

        <ClickHint $hidden={mine.length > 0}>circle to add</ClickHint>
      </div>
    </PageRoot>
  );
});
ProductFlipPage.displayName = 'ProductFlipPage';

// ─── Cookie tutorial page ─────────────────────────────────────────────────────

const CookieBg = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 38%, #3a2a14 0%, #1a1206 60%, #0d0a04 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
`;

const CookieGlyph = styled.div`
  font-size: clamp(4rem, 14vw, 7rem);
  line-height: 1;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.6));
`;

const CookieTitle = styled.h2`
  font-size: clamp(1.3rem, 3vw, 2rem);
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.04em;
  margin-bottom: 0.85rem;
`;

const CookieText = styled.p`
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.7);
  max-width: 300px;

  b { color: #ffcf6b; }
`;

const CookieCounter = styled.div`
  margin-top: 1.5rem;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);

  span { color: #ffcf6b; font-weight: 700; }
`;

const CookieFlipPage = forwardRef<HTMLDivElement, {
  side?: 'left' | 'right';
  pageWidth: number;
  flipGuard?: () => boolean;
}>(({ side, pageWidth, flipGuard }, ref) => {
  const { addCircle, circles } = useCart();
  const layerRef = useRef<HTMLDivElement>(null);

  const mine = circles.filter((c) => c.productId === COOKIE_ID);
  useRepaintBurst(layerRef, mine.length);

  const { onPointerDown, onClick } = usePageClick(useCallback(({ x, y, rect }) => {
    const xPct = (x - rect.left) / rect.width;
    const yPct = (y - rect.top) / rect.height;
    addCircle({ productId: COOKIE_ID, variantId: COOKIE_ID, xPct, yPct, rPct: 0.22 });
  }, [addCircle]), flipGuard);

  return (
    <PageRoot ref={ref} className={side === 'left' ? '--left' : '--right'}
      style={{ cursor: 'crosshair' }} onPointerDown={onPointerDown} onClick={onClick}>
      <CookieBg>
        <CookieGlyph>🍪</CookieGlyph>
        <CookieTitle>Try it on the cookie</CookieTitle>
        <CookieText>
          Tap the cookie to circle it — that&apos;s how you add anything to your bag.
          Circle as many as you can: <b>most circles wins {PRIZE}.</b>
        </CookieText>
        <CookieCounter>Cookies circled · <span>{mine.length}</span></CookieCounter>
      </CookieBg>

      <CircleLayer ref={layerRef}>
        {mine.map((c) => (
          <CircleAnchor key={c.circleId} style={{ left: `${c.xPct * 100}%`, top: `${c.yPct * 100}%` }}>
            <CrayonCircle size={c.rPct * pageWidth * 2} seed={c.seed} />
          </CircleAnchor>
        ))}
      </CircleLayer>
    </PageRoot>
  );
});
CookieFlipPage.displayName = 'CookieFlipPage';

// ─── Cover page ───────────────────────────────────────────────────────────────

const CoverInner = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem 2.2rem;
  text-align: left;
`;

const CoverIssue = styled.div`
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  margin-bottom: 0.6rem;
`;

const CoverLogo = styled.div`
  font-size: clamp(1.8rem, 4.5vw, 2.8rem);
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1;
`;

const CoverSub = styled.div`
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  margin-top: 0.5rem;
`;

// ─── Rules panel (fixed, bottom-left of the screen — in the page margin) ──────

const RulesPanelBox = styled.aside`
  position: fixed;
  bottom: 1.75rem;
  left: 1.75rem;
  z-index: 40;
  max-width: 260px;
  color: #2a0014;

  /* there's no side margin on phones — only show where there's room */
  @media (max-width: 1100px) { display: none; }
`;

const RulesHead = styled.div`
  font-size: 0.6rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(120, 20, 60, 0.65);
  margin-bottom: 1rem;
`;

const RuleRow = styled.div`
  display: flex;
  gap: 0.7rem;
  margin-bottom: 0.85rem;

  .n {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid #c0446a;
    color: #c0446a;
    font-size: 0.62rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .t {
    font-size: 0.74rem;
    line-height: 1.45;
    color: rgba(60, 10, 30, 0.8);
  }
  .t b { color: #1a0010; }
`;

const CookieRule = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(192, 68, 106, 0.25);
  font-size: 0.74rem;
  line-height: 1.5;
  color: rgba(60, 10, 30, 0.8);
  b { color: #c0446a; }
`;

function RulesPanel() {
  return (
    <RulesPanelBox>
      <RulesHead>How it works</RulesHead>
      <RuleRow>
        <span className="n">1</span>
        <span className="t"><b>Flip through it.</b> Swipe, use the ‹ › arrows, or your keyboard ← →.</span>
      </RuleRow>
      <RuleRow>
        <span className="n">2</span>
        <span className="t"><b>Like something?</b> Tap it to circle it — that drops it in your bag.</span>
      </RuleRow>
      <RuleRow>
        <span className="n">3</span>
        <span className="t"><b>Circle again to add more.</b> Open your bag, top right.</span>
      </RuleRow>
      <CookieRule>
        🍪 Warm up on the cookie — circle it as many times as you can. <b>Most circles wins {PRIZE}.</b>
      </CookieRule>
    </RulesPanelBox>
  );
}

const CoverPage = forwardRef<HTMLDivElement, { side?: 'left' | 'right' }>(({ side }, ref) => (
  <PageRoot ref={ref} className={side === 'left' ? '--left' : '--right'}
    style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a1a1a 0%, #000 70%)' }}>
    <CoverInner>
      <CoverIssue>Issue 01</CoverIssue>
      <CoverLogo>Dripstar</CoverLogo>
      <CoverSub>The Drop</CoverSub>
    </CoverInner>
  </PageRoot>
));
CoverPage.displayName = 'CoverPage';

// ─── Editorial data ───────────────────────────────────────────────────────────

const EDITORIALS = [
  { label: 'Issue 01 — The Drop', headline: 'Wear the\nmoment.', body: 'Limited runs. Deliberate design. Every piece is the last piece.', gradient: 'linear-gradient(160deg,#0d0d0d 0%,#2d1200 100%)' },
  { label: 'Culture', headline: 'Street is\neverything.', body: 'Born from the block, built for the world.', gradient: 'linear-gradient(160deg,#000 0%,#12001f 100%)' },
  { label: 'Coming Soon', headline: 'The next\ndrop lands.', body: 'Stay tuned.', gradient: 'linear-gradient(160deg,#000 0%,#001a12 100%)' },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { products: Product[] }

const MOBILE_BREAKPOINT = 768;
const PAGE_RATIO = 560 / 750; // w / h of a single page

function calcBookSize(isMobile: boolean) {
  if (typeof window === 'undefined') return { width: 560, height: 750 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (isMobile) {
    // Single page, vertical, with room on the sides for the nav arrows.
    let w = vw * 0.78;
    let h = w / PAGE_RATIO;
    const maxH = vh * 0.78; // leave room for navbar + page counter
    if (h > maxH) { h = maxH; w = h * PAGE_RATIO; }
    return { width: Math.floor(w), height: Math.floor(h) };
  }

  // Desktop: one page of a two-page spread.
  const CAP_W = 660;
  const CAP_H = 880;
  const maxH = Math.min(vh * 0.88, CAP_H);
  const maxW = Math.min((vw * 0.92) / 2, CAP_W);
  let h = maxH;
  let w = h * PAGE_RATIO;
  if (w > maxW) { w = maxW; h = w / PAGE_RATIO; }
  return { width: Math.floor(w), height: Math.floor(h) };
}

function useIsMobile() {
  const get = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
  const [mobile, setMobile] = useState(get);
  useEffect(() => {
    const onChange = () => setMobile(get());
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    return () => { window.removeEventListener('resize', onChange); window.removeEventListener('orientationchange', onChange); };
  }, []);
  return mobile;
}

function useBookSize(isMobile: boolean) {
  const [size, setSize] = useState(() => calcBookSize(isMobile));
  useEffect(() => {
    const onResize = () => setSize(calcBookSize(isMobile));
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize); };
  }, [isMobile]);
  return size;
}

export default function MagazineHome({ products }: Props) {
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const isMobile = useIsMobile();
  const { width, height } = useBookSize(isMobile);

  const flip = useCallback((dir: 'next' | 'prev') => {
    let api: any = null;
    try { api = bookRef.current?.pageFlip?.() ?? null; } catch { api = null; }
    if (!api) return;
    try { dir === 'next' ? api.flipNext() : api.flipPrev(); } catch { /* ignore */ }
  }, []);

  // Track flip activity so a click that turns a page (e.g. a corner click)
  // never also circles an item.
  const lastFlipRef = useRef(0);
  const flippingRef = useRef(false);
  const [isFlippingView, setIsFlippingView] = useState(false);
  const onChangeState = useCallback((e: any) => {
    const s = e?.data;
    if (s === 'flipping' || s === 'user_fold' || s === 'fold_corner') {
      flippingRef.current = true;
      lastFlipRef.current = Date.now();
      setIsFlippingView(true);
    } else if (s === 'read') {
      flippingRef.current = false;
      lastFlipRef.current = Date.now();
      setIsFlippingView(false);
    }
  }, []);
  const flipGuard = useCallback(
    () => flippingRef.current || Date.now() - lastFlipRef.current < 450,
    [],
  );

  // Keyboard arrow navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); flip('next'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); flip('prev'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flip]);

  // Build flat page list — react-pageflip needs an even number of pages
  // Pages are rendered as single pages; the library pairs them as spreads
  const pages: React.ReactNode[] = [];

  // Opening spread: cover + cookie tutorial page.
  pages.push(<CoverPage key="cover-l" side="left" />);
  pages.push(<CookieFlipPage key="cookie" pageWidth={width} side="right" flipGuard={flipGuard} />);
  pages.push(<EditorialFlipPage key="ed-0" {...EDITORIALS[0]} side="left" />);

  // Product pages interleaved with editorial
  products.forEach((p, i) => {
    pages.push(<ProductFlipPage key={p.id} product={p} pageWidth={width} pageHeight={height} flipGuard={flipGuard} side={pages.length % 2 === 0 ? 'left' : 'right'} />);
    if ((i + 1) % 4 === 0) {
      const ed = EDITORIALS[Math.floor((i + 1) / 4)];
      if (ed) {
        pages.push(<EditorialFlipPage key={`ed-${i}`} {...ed} side={pages.length % 2 === 0 ? 'left' : 'right'} />);
      }
    }
  });

  // Back cover (must be even total)
  if (pages.length % 2 !== 0) {
    pages.push(<CoverPage key="back" side="right" />);
  }

  const totalSpreads = Math.ceil(pages.length / 2);

  return (
    <>
    <RulesPanel />
    <Stage>
      <BookWrap style={{ width: isMobile ? width : width * 2, height }}>
        <NavBtn type="button" $side="left" $hidden={isFlippingView} onClick={() => flip('prev')}>‹</NavBtn>
        <NavBtn type="button" $side="right" $hidden={isFlippingView} onClick={() => flip('next')}>›</NavBtn>
        <HTMLFlipBook
          key={isMobile ? 'portrait' : 'landscape'}
          ref={bookRef}
          width={width}
          height={height}
          size="fixed"
          minWidth={160}
          maxWidth={980}
          minHeight={200}
          maxHeight={1400}
          drawShadow={true}
          flippingTime={700}
          usePortrait={isMobile}
          startPage={0}
          autoSize={false}
          maxShadowOpacity={0.6}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={(e: any) => { setPage(e.data); lastFlipRef.current = Date.now(); }}
          onChangeState={onChangeState}
          className="magazine-book"
          style={{}}
          startZIndex={0}
          swipeDistance={30}
          clickEventForward={true}
          useMouseEvents={true}
          renderOnlyPageLengthChange={false}
          showPageCorners={false}
          disableFlipByClick={true}
        >
          {pages as any}
        </HTMLFlipBook>
      </BookWrap>

      <PageCounter>
        {isMobile ? `${page + 1} / ${pages.length}` : `${Math.ceil(page / 2) + 1} / ${totalSpreads}`}
      </PageCounter>
    </Stage>
    </>
  );
}
