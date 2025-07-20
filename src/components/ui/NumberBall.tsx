import React from 'react';

interface NumberBallProps {
  number: number;
  variant?: 'main' | 'bonus';
  className?: string;
}

export default function NumberBall({ number, variant = 'main', className = '' }: NumberBallProps) {
  let colorClass = '';
  if (variant === 'bonus') {
    colorClass = 'lotto-bonus-ball';
  } else if (number >= 1 && number <= 10) {
    colorClass = 'lotto-range-1';
  } else if (number >= 11 && number <= 20) {
    colorClass = 'lotto-range-2';
  } else if (number >= 21 && number <= 30) {
    colorClass = 'lotto-range-3';
  } else if (number >= 31 && number <= 40) {
    colorClass = 'lotto-range-4';
  } else if (number >= 41 && number <= 45) {
    colorClass = 'lotto-range-5';
  } else {
    colorClass = 'lotto-range-2';
  }
  return (
    <span className={`number-ball ${colorClass} ${className}`}>{number}</span>
  );
} 