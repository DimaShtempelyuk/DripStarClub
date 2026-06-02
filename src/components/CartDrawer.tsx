'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
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

export default function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, removeItem, updateItem } = useCart();

  const lines = cart?.lines.nodes ?? [];
  const total = cart?.cost.totalAmount;

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

            {lines.length === 0 ? (
              <Empty>Your cart is empty</Empty>
            ) : (
              <Items>
                {lines.map((line) => (
                  <LineItem key={line.id}>
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
                        {line.cost.totalAmount.currencyCode} {line.cost.totalAmount.amount}
                      </span>
                    </LineInfo>
                    <QtyControl>
                      <button onClick={() => line.quantity > 1 ? updateItem(line.id, line.quantity - 1) : removeItem(line.id)}>−</button>
                      <span>{line.quantity}</span>
                      <button onClick={() => updateItem(line.id, line.quantity + 1)}>+</button>
                    </QtyControl>
                  </LineItem>
                ))}
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
