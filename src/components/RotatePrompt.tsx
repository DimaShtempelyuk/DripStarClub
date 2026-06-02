'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const rotatePhone = keyframes`
  0%   { transform: rotate(0deg); }
  30%  { transform: rotate(0deg); }
  60%  { transform: rotate(90deg); }
  100% { transform: rotate(90deg); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(ellipse at 60% 30%, #ffd6e8 0%, #ffb3d1 30%, #f8e1ec 60%, #fff0f6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  animation: ${fadeIn} 0.3s ease;
`;

const PhoneIcon = styled.div`
  font-size: 3.5rem;
  animation: ${rotatePhone} 2s ease-in-out infinite alternate;
  transform-origin: center;
`;

const Message = styled.div`
  text-align: center;
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1a0010;
  margin-bottom: 0.5rem;
`;

const Sub = styled.p`
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  color: rgba(100, 20, 60, 0.6);
  text-transform: uppercase;
`;

const IssueLabel = styled.div`
  font-size: 0.62rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(180, 80, 120, 0.5);
  position: absolute;
  bottom: 2rem;
`;

export default function RotatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    function check() {
      const isMobile = window.innerWidth < 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowPrompt(isMobile && isPortrait);
    }

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!showPrompt) return null;

  return (
    <Overlay>
      <PhoneIcon>📱</PhoneIcon>
      <Message>
        <Title>Rotate for the full experience</Title>
        <Sub>This magazine is best viewed horizontally</Sub>
      </Message>
      <IssueLabel>Dripstar — Issue 01</IssueLabel>
    </Overlay>
  );
}
