'use client';

import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant } from '@/lib/shopify';
import { useCart } from '@/context/CartContext';

const Wrap = styled.main`
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #000;
  color: #fff;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Gallery = styled.div`
  position: sticky;
  top: 0;
  height: 100svh;
  background: #080808;
  overflow: hidden;

  @media (max-width: 768px) {
    position: relative;
    height: 60vw;
  }
`;

const ThumbRail = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 2;
`;

const Thumb = styled.button<{ $active?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 3px;
  overflow: hidden;
  border: 2px solid ${({ $active }) => ($active ? '#fff' : 'transparent')};
  background: #111;
  cursor: pointer;
  position: relative;
  padding: 0;
`;

const Info = styled.div`
  padding: 6rem 3.5rem 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const BackLink = styled(Link)`
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #555;
  &:hover { color: #fff; }
`;

const Title = styled.h1`
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 800;
  line-height: 1.05;
`;

const Price = styled.p`
  font-size: 1.3rem;
  font-weight: 600;
`;

const Description = styled.div`
  font-size: 0.9rem;
  line-height: 1.75;
  color: #888;
  max-width: 440px;

  p { margin-bottom: 0.75rem; }
`;

const VariantLabel = styled.p`
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #555;
`;

const Variants = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const VariantBtn = styled.button<{ $active?: boolean; $disabled?: boolean }>`
  padding: 0.55rem 1.1rem;
  border-radius: 50px;
  border: 1px solid ${({ $active }) => ($active ? '#fff' : '#2a2a2a')};
  background: ${({ $active }) => ($active ? '#fff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#000' : '#fff')};
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.35 : 1)};
  transition: all 0.15s;
`;

const circlePulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(220,0,0,0.7); }
  70%  { box-shadow: 0 0 0 14px rgba(220,0,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(220,0,0,0); }
`;

const AddBtn = styled.button<{ $active?: boolean }>`
  padding: 1rem 2.8rem;
  border-radius: 50px;
  border: 2px solid #fff;
  background: transparent;
  color: #fff;
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.2s, color 0.2s;

  ${({ $active }) =>
    $active &&
    css`
      border-color: #e00;
      animation: ${circlePulse} 0.9s ease-out;
    `}

  &:hover { background: #fff; color: #000; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

interface Props {
  product: Product;
}

export default function ProductDetail({ product }: Props) {
  const { addItem, lastAddedVariantId } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants.nodes[0]);

  const images = product.images.nodes;
  const isActive = lastAddedVariantId === selectedVariant?.id;

  return (
    <Wrap>
      <Gallery>
        {images[activeImage] && (
          <Image
            src={images[activeImage].url}
            alt={images[activeImage].altText ?? product.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="50vw"
            priority
          />
        )}
        {images.length > 1 && (
          <ThumbRail>
            {images.map((img, i) => (
              <Thumb key={i} $active={i === activeImage} onClick={() => setActiveImage(i)}>
                <Image src={img.url} alt={img.altText ?? ''} fill style={{ objectFit: 'cover' }} sizes="48px" />
              </Thumb>
            ))}
          </ThumbRail>
        )}
      </Gallery>

      <Info>
        <BackLink href="/">← Back</BackLink>
        <Title>{product.title}</Title>
        <Price>
          {selectedVariant?.price.currencyCode} {selectedVariant?.price.amount}
        </Price>

        {product.variants.nodes.length > 1 && (
          <div>
            <VariantLabel>Select option</VariantLabel>
            <Variants>
              {product.variants.nodes.map((v) => (
                <VariantBtn
                  key={v.id}
                  $active={v.id === selectedVariant?.id}
                  $disabled={!v.availableForSale}
                  onClick={() => v.availableForSale && setSelectedVariant(v)}
                >
                  {v.title}
                </VariantBtn>
              ))}
            </Variants>
          </div>
        )}

        <AddBtn
          $active={isActive}
          disabled={!selectedVariant?.availableForSale}
          onClick={() => selectedVariant && addItem(selectedVariant.id)}
        >
          {selectedVariant?.availableForSale ? 'Add to bag' : 'Sold out'}
        </AddBtn>

        <Description dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      </Info>
    </Wrap>
  );
}
