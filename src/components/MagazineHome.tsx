'use client';

import React, { useEffect, useRef, useState, forwardRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import styled, { keyframes, css } from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/shopify';
import { useCart } from '@/context/CartContext';
import CrayonCircle from './CrayonCircle';

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
  /* drop shadow under the open book */
  filter: drop-shadow(0 50px 100px rgba(0,0,0,1)) drop-shadow(0 10px 30px rgba(0,0,0,0.8));
`;

// ─── Nav arrows ───────────────────────────────────────────────────────────────

const NavBtn = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $side }) => $side === 'left' ? 'left: 2rem;' : 'right: 2rem;'}
  z-index: 10;
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(220,100,150,0.25);
  color: #c0446a;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.75); }

  @media (max-width: 900px) {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
    ${({ $side }: any) => $side === 'left' ? 'left: 0.5rem;' : 'right: 0.5rem;'}
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
}>(({ product, side, pageWidth }, ref) => {
  const { addCircle, circles } = useCart();
  const variant = product.variants.nodes[0];
  const layerRef = useRef<HTMLDivElement>(null);

  const mine = circles.filter((c) => c.productId === product.id);
  useRepaintBurst(layerRef, mine.length);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variant) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    addCircle({ productId: product.id, variantId: variant.id, xPct, yPct, rPct: 0.3 });
  }, [variant, product.id, addCircle]);

  return (
    <PageRoot ref={ref} className={side === 'left' ? '--left' : '--right'}
      style={{ cursor: 'crosshair' }} onClick={handleClick}>
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

// ─── Cover page (page 0 — left side always blank spine) ──────────────────────

const CoverPage = forwardRef<HTMLDivElement, { side?: 'left' | 'right' }>(({ side }, ref) => (
  <PageRoot ref={ref} className={side === 'left' ? '--left' : '--right'}
    style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', textTransform: 'uppercase' }}>Issue 01</div>
      <div style={{ fontSize: 'clamp(1.4rem,3vw,2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Dripstar</div>
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginTop: '0.75rem', textTransform: 'uppercase' }}>The Drop</div>
    </div>
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

function calcBookSize() {
  if (typeof window === 'undefined') return { width: 560, height: 750 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CAP_W = 660;
  const CAP_H = 880;
  const ratio = 560 / 750;
  const maxH = Math.min(vh * 0.88, CAP_H);
  const maxW = Math.min((vw * 0.92) / 2, CAP_W);
  let h = maxH;
  let w = h * ratio;
  if (w > maxW) { w = maxW; h = w / ratio; }
  return { width: Math.floor(w), height: Math.floor(h) };
}

function useBookSize() {
  const [size, setSize] = useState(calcBookSize);
  useEffect(() => {
    function onResize() { setSize(calcBookSize()); }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize); };
  }, []);
  return size;
}

export default function MagazineHome({ products }: Props) {
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const { width, height } = useBookSize();

  // Build flat page list — react-pageflip needs an even number of pages
  // Pages are rendered as single pages; the library pairs them as spreads
  const pages: React.ReactNode[] = [];

  // Cover spread (pages 0 & 1)
  pages.push(<CoverPage key="cover-l" side="left" />);
  pages.push(<EditorialFlipPage key="ed-0" {...EDITORIALS[0]} side="right" />);

  // Product pages interleaved with editorial
  products.forEach((p, i) => {
    pages.push(<ProductFlipPage key={p.id} product={p} pageWidth={width} pageHeight={height} side={pages.length % 2 === 0 ? 'left' : 'right'} />);
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
    <Stage>
      <NavBtn $side="left" onClick={() => bookRef.current?.pageFlip().flipPrev()}>‹</NavBtn>
      <NavBtn $side="right" onClick={() => bookRef.current?.pageFlip().flipNext()}>›</NavBtn>

      <BookWrap>
        <HTMLFlipBook
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
          usePortrait={false}
          startPage={0}
          autoSize={false}
          maxShadowOpacity={0.6}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={(e: any) => setPage(e.data)}
          className="magazine-book"
          style={{}}
          startZIndex={0}
          swipeDistance={30}
          clickEventForward={true}
          useMouseEvents={true}
          renderOnlyPageLengthChange={false}
          showPageCorners={true}
          disableFlipByClick={true}
        >
          {pages as any}
        </HTMLFlipBook>
      </BookWrap>

      <PageCounter>
        {Math.ceil(page / 2) + 1} / {totalSpreads}
      </PageCounter>
    </Stage>
  );
}
