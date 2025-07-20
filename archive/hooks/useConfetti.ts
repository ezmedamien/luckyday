import { useCallback, useRef } from 'react';

interface ConfettiOptions {
  duration?: number;
  particleCount?: number;
  colors?: string[];
  spread?: number;
}

export function useConfetti() {
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const triggerConfetti = useCallback((options: ConfettiOptions = {}) => {
    const {
      duration = 2000,
      particleCount = 50,
      colors = ['#FFCC33', '#4F5DFF', '#00CC66'],
      spread = 100
    } = options;

    // Clear any existing timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    // Create confetti elements
    const confettiElements: HTMLElement[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const element = document.createElement('div');
      element.className = 'confetti';
      element.style.left = `${Math.random() * spread}%`;
      element.style.animationDelay = `${Math.random() * 0.5}s`;
      element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      element.style.position = 'fixed';
      element.style.top = '-10px';
      element.style.width = '10px';
      element.style.height = '10px';
      element.style.pointerEvents = 'none';
      element.style.zIndex = '9999';
      
      document.body.appendChild(element);
      confettiElements.push(element);
    }

    // Clean up after animation
    const timeout = setTimeout(() => {
      confettiElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    }, duration);

    timeoutRefs.current.push(timeout);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  return {
    triggerConfetti,
    cleanup
  };
} 