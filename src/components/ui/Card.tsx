import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'generator' | 'search' | 'plain';
  children: React.ReactNode;
}

export default function Card({ variant = 'plain', className = '', children, ...props }: CardProps) {
  let base = '';
  if (variant === 'generator') base = 'card-generator';
  else if (variant === 'search') base = 'search-card';
  else base = 'card';

  return (
    <div className={[base, className].join(' ')} {...props}>
      {children}
    </div>
  );
} 