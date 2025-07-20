import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'pill' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  let base = '';
  if (variant === 'primary') base = 'btn-primary';
  else if (variant === 'secondary') base = 'btn-secondary';
  else if (variant === 'pill') base = 'btn-primary-pill';
  else if (variant === 'icon') base = 'btn-icon';

  return (
    <button
      className={[
        base,
        loading ? 'btn-loading' : '',
        className
      ].join(' ')}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && <span className="spinner" aria-label="로딩 중" />}
      {children}
    </button>
  );
} 