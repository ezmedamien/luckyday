import React from 'react';
import { useInView } from 'react-intersection-observer';

interface NumberCardProps {
  number: number;
  variant?: 'main' | 'bonus' | 'hit';
  className?: string;
}

export default function NumberCard({ number, variant = 'main', className = '' }: NumberCardProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  let colorClass = 'number-ball-main';
  if (variant === 'bonus') colorClass = 'number-ball-bonus';
  else if (variant === 'hit') colorClass = 'number-ball-hit';

  return (
    <span
      ref={ref}
      className={`number-ball ${colorClass} ${inView ? 'animate-bounce' : ''} ${className}`}
      aria-label={`번호 ${number}번`}
      title={`번호 ${number}번`}
    >
      {number}
    </span>
  );
} 