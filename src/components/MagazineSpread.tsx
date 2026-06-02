'use client';

import React, { useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/shopify';

// ─── Page container (scroll-snap child) ──────────────────────────────────────

export const Page = styled.section`
  height: 100svh;
  width: 100%;
  scroll-snap-align: start;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// ─── Shared page turn overlay ─────────────────────────────────────────────────

const pageFold = keyframes`
  0%   { opacity: 0; transform: perspective(1200px) rotateY(-4deg) translateX(-30px); }
  100% { opacity: 1; transform: perspective(1200px) rotateY(0deg)  translateX(0); }
`;

export const PageInner = styled(motion.div)`
  width: 100%;
  height: 100%;
  animation: ${pageFold} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

// ─── Editorial page ───────────────────────────────────────────────────────────

const EditorialBg = styled.div<{ $gradient?: string }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  background: ${({ $gradient }) => $gradient ?? '#0a0a0a'};

  img { object-fit: cover; }
`;

const EditorialOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 60%);
  z-index: 1;
`;

const EditorialContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  padding: 3rem 4rem;
  max-width: 680px;
  align-self: flex-end;
  margin-bottom: 6rem;
`;

const EditorialLabel = styled.span`
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  display: block;
  margin-bottom: 1rem;
`;

const EditorialHeadline = styled.h2`
  font-size: clamp(2.4rem, 5vw, 5rem);
  font-weight: 800;
  line-height: 1.0;
  color: #fff;
  margin: 0 0 1.5rem;
`;

const EditorialBody = styled.p`
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.75);
  max-width: 460px;
`;

interface EditorialPageProps {
  label: string;
  headline: string;
  body?: string;
  imageSrc?: string;
  imageAlt?: string;
  gradient?: string;
}

export function EditorialPage({ label, headline, body, imageSrc, imageAlt, gradient }: EditorialPageProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });

  return (
    <Page ref={ref}>
      <PageInner>
        <EditorialBg $gradient={gradient}>
          {imageSrc && <Image src={imageSrc} alt={imageAlt ?? ''} fill priority sizes="100vw" />}
        </EditorialBg>
        <EditorialOverlay />
        <EditorialContent
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <EditorialLabel>{label}</EditorialLabel>
          <EditorialHeadline>{headline}</EditorialHeadline>
          {body && <EditorialBody>{body}</EditorialBody>}
        </EditorialContent>
      </PageInner>
    </Page>
  );
}

// ─── Product page ─────────────────────────────────────────────────────────────

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProductImagePane = styled.div`
  position: relative;
  overflow: hidden;
  background: #080808;

  img { object-fit: cover; transition: transform 0.8s cubic-bezier(0.22,1,0.36,1); }
  &:hover img { transform: scale(1.04); }
`;

const ProductInfoPane = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem;
  background: #050505;
  color: #fff;
  gap: 1.25rem;

  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const ProductMeta = styled.span`
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #555;
`;

const ProductTitle = styled.h3`
  font-size: clamp(1.6rem, 3.5vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
`;

const ProductDesc = styled.p`
  font-size: 0.9rem;
  line-height: 1.7;
  color: #888;
  max-width: 380px;
`;

const ProductPrice = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
`;

const circlePulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(220, 0, 0, 0.7); }
  70%  { box-shadow: 0 0 0 14px rgba(220, 0, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 0, 0, 0); }
`;

const AddBtn = styled.button<{ $active?: boolean }>`
  align-self: flex-start;
  padding: 0.85rem 2.2rem;
  border-radius: 50px;
  border: 2px solid #fff;
  background: transparent;
  color: #fff;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;

  ${({ $active }) =>
    $active &&
    css`
      border-color: #e00;
      box-shadow: 0 0 0 0 rgba(220, 0, 0, 0.7);
      animation: ${circlePulse} 0.9s ease-out;
    `}

  &:hover {
    background: #fff;
    color: #000;
  }
`;

const ViewLink = styled(Link)`
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #555;
  text-decoration: none;
  margin-top: 0.5rem;
  &:hover { color: #fff; }
`;

interface ProductSpreadProps {
  product: Product;
  imageFirst?: boolean;
}

export function ProductSpread({ product, imageFirst = true }: ProductSpreadProps) {
  const { addItem, lastAddedVariantId } = useCart();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });

  const firstVariant = product.variants.nodes[0];
  const price = product.priceRange.minVariantPrice;
  const isActive = lastAddedVariantId === firstVariant?.id;

  const image = (
    <ProductImagePane>
      {product.featuredImage && (
        <Image
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          fill
          sizes="50vw"
        />
      )}
    </ProductImagePane>
  );

  const info = (
    <ProductInfoPane
      initial={{ opacity: 0, x: imageFirst ? 40 : -40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 }}
    >
      <ProductMeta>New drop</ProductMeta>
      <ProductTitle>{product.title}</ProductTitle>
      {product.description && (
        <ProductDesc>{product.description.slice(0, 180)}{product.description.length > 180 ? '…' : ''}</ProductDesc>
      )}
      <ProductPrice>{price.currencyCode} {price.amount}</ProductPrice>
      {firstVariant && (
        <AddBtn
          $active={isActive}
          onClick={() => addItem(firstVariant.id)}
        >
          Add to bag
        </AddBtn>
      )}
      <ViewLink href={`/products/${product.handle}`}>View product →</ViewLink>
    </ProductInfoPane>
  );

  return (
    <Page ref={ref}>
      <PageInner>
        <ProductGrid>
          {imageFirst ? <>{image}{info}</> : <>{info}{image}</>}
        </ProductGrid>
      </PageInner>
    </Page>
  );
}
