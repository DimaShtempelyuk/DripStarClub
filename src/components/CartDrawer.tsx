'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useCookieGame } from '@/context/CookieGameContext';
import { COOKIE_GAME } from '@/lib/cookieGame';
import Image from 'next/image';

const slideIn = keyframes`from { transform: translateX(100%); } to { transform: translateX(0); }`;

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
`;

const Drawer = styled(motion.aside)`
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(420px, 95vw);
  background: #0a0a0a;
  color: #fff;
  z-index: 101;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #1f1f1f;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid #1f1f1f;

  h2 {
    font-size: 0.85rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 500;
  }
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
  &:hover { color: #fff; }
`;

const Items = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const LineItem = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 1rem;
  align-items: center;

  /* the cookie-game free magazine — distinct gold reward treatment */
  &.reward {
    padding: 0.6rem;
    margin: 0 -0.6rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 207, 107, 0.4);
    background: linear-gradient(135deg, rgba(255, 207, 107, 0.12), rgba(255, 159, 67, 0.04));
  }
`;

// quantity, shown but locked (the reward can't be added to / removed)
const LockedQty = styled.span`
  font-size: 0.82rem;
  color: #888;
  font-variant-numeric: tabular-nums;
`;

const Thumb = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 4px;
  overflow: hidden;
  background: #111;
`;

const LineInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.82rem;

  .title { font-weight: 500; }
  .variant { color: #666; }
  .price { color: #ccc; margin-top: 0.15rem; }
  .price .free { color: #ffcf6b; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
`;

const QtyControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;

  button {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    color: #fff;
    width: 24px;
    height: 24px;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover { background: #2a2a2a; }
  }
`;

const Footer = styled.div`
  padding: 1.5rem 1.75rem;
  border-top: 1px solid #1f1f1f;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  letter-spacing: 0.06em;

  span:last-child { font-weight: 600; }
`;

const CheckoutBtn = styled.a`
  display: block;
  background: #e00;
  color: #fff;
  text-align: center;
  padding: 0.9rem;
  border-radius: 4px;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  &:hover { background: #c00; }
`;

const Empty = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

// Fallback free-magazine reward strip. NOT a real Shopify line — shown only when
// the magazine is claimed but the real $0 "D* Magazine" line couldn't be added to
// the cart (e.g. the variant isn't availableForSale). Once it can be added, the
// real cover-image line in the list above replaces this.
const MagReward = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 207, 107, 0.45);
  background: linear-gradient(135deg, rgba(255, 207, 107, 0.13), rgba(255, 159, 67, 0.05));

  .emoji { font-size: 1.6rem; line-height: 1; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5)); }
  .body { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
  .ttl {
    font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800;
    color: #ffcf6b;
  }
  .sub { font-size: 0.76rem; color: rgba(255, 255, 255, 0.62); }
`;


export default function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, incrementProduct, decrementProduct } = useCart();
  const { claimed } = useCookieGame();

  const lines = cart?.lines.nodes ?? [];
  const total = cart?.cost.totalAmount;
  // The real $0 "D* Magazine" line, once it makes it into the Shopify cart.
  const hasRealMagLine = lines.some((l) => l.merchandise.product.handle === COOKIE_GAME.magazineHandle);
  // Fallback gold strip: earned, but the real line couldn't be added yet
  // (e.g. the variant isn't availableForSale in Shopify).
  const showMagReward = claimed.magazine && !hasRealMagLine;

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <Overlay
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
          <Drawer
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
          >
            <Header>
              <h2>Cart {cart?.totalQuantity ? `(${cart.totalQuantity})` : ''}</h2>
              <CloseBtn onClick={closeDrawer}>✕</CloseBtn>
            </Header>

            {lines.length === 0 && !showMagReward ? (
              <Empty>Your cart is empty</Empty>
            ) : (
              <Items>
                {showMagReward && (
                  <MagReward>
                    <span className="emoji" aria-hidden>📖</span>
                    <div className="body">
                      <span className="ttl">{COOKIE_GAME.magazineRewardTitle}</span>
                      <span className="sub">{COOKIE_GAME.magazineRewardSubtitle} ✓</span>
                    </div>
                  </MagReward>
                )}
                {lines.map((line) => {
                  const isReward = line.merchandise.product.handle === COOKIE_GAME.magazineHandle;
                  return (
                    <LineItem key={line.id} className={isReward ? 'reward' : undefined}>
                      <Thumb>
                        {line.merchandise.product.featuredImage && (
                          <Image
                            src={line.merchandise.product.featuredImage.url}
                            alt={line.merchandise.product.featuredImage.altText ?? ''}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="64px"
                          />
                        )}
                      </Thumb>
                      <LineInfo>
                        <span className="title">{line.merchandise.product.title}</span>
                        {line.merchandise.title !== 'Default Title' && (
                          <span className="variant">{line.merchandise.title}</span>
                        )}
                        <span className="price">
                          {isReward ? (
                            <span className="free">Free · cookie reward</span>
                          ) : (
                            <>{line.cost.totalAmount.currencyCode} {line.cost.totalAmount.amount}</>
                          )}
                        </span>
                      </LineInfo>
                      {isReward ? (
                        // locked at qty 1 — no adding more, no removing the reward
                        <LockedQty aria-label="reward quantity locked">×{line.quantity}</LockedQty>
                      ) : (
                        <QtyControl>
                          <button onClick={() => decrementProduct(line.merchandise.product.id)}>−</button>
                          <span>{line.quantity}</span>
                          <button onClick={() => incrementProduct(line.merchandise.product.id, line.merchandise.id)}>+</button>
                        </QtyControl>
                      )}
                    </LineItem>
                  );
                })}
              </Items>
            )}

            {lines.length > 0 && (
              <Footer>
                <Total>
                  <span>Total</span>
                  <span>{total?.currencyCode} {total?.amount}</span>
                </Total>
                <CheckoutBtn href={cart?.checkoutUrl} target="_blank" rel="noopener">
                  Checkout
                </CheckoutBtn>
              </Footer>
            )}
          </Drawer>
        </>
      )}
    </AnimatePresence>
  );
}
