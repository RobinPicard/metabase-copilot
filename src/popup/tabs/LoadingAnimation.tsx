import React from 'react';
import styled, { keyframes } from 'styled-components';


const LoadingAnimation: React.FC = () => {
  return (
    <LoadingContainer>
      <LoadingBar />
    </LoadingContainer>
  );
};

const moveGradient = keyframes`
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex-grow: 1;
`;

const LoadingBar = styled.div`
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(240, 240, 240, 0.1) 0%,
    rgba(240, 240, 240, 0.1) 10%,
    rgba(240, 240, 240, 0.2) 20%,
    rgba(224, 224, 224, 0.3) 50%,
    rgba(240, 240, 240, 0.2) 80%,
    rgba(240, 240, 240, 0.1) 90%,
    rgba(240, 240, 240, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: ${moveGradient} 1s linear infinite;
  flex-grow: 1;
`;


export default LoadingAnimation;
