"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SocialAuthButtonsProps {
  onSwitchToEmail: () => void;
}

export default function SocialAuthButtons({ onSwitchToEmail }: SocialAuthButtonsProps) {
  const [loading, setLoading] = useState<'kakao' | 'naver' | null>(null);
  const [error, setError] = useState('');
  const { signInWithProvider } = useAuth();

  const handleSocialLogin = async (provider: 'kakao' | 'naver') => {
    setLoading(provider);
    setError('');

    const { error } = await signInWithProvider(provider);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(null);
  };

  return (
    <div className="social-auth-container">
      <button
        onClick={() => handleSocialLogin('kakao')}
        disabled={loading !== null}
        className="social-auth-button kakao"
        aria-label="카카오로 로그인"
      >
        {loading === 'kakao' ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <svg className="social-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 1C4.48 1 0 4.58 0 9c0 3.54 2.65 6.53 6.36 7.91-.17.62-.65 2.26-.75 2.61-.12.42.18.42.33.31.24-.18 3.85-2.49 5.38-3.49.72.1 1.47.16 2.28.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z" fill="currentColor"/>
            </svg>
            카카오로 계속하기
          </>
        )}
      </button>

      <button
        onClick={() => handleSocialLogin('naver')}
        disabled={loading !== null}
        className="social-auth-button naver"
        aria-label="네이버로 로그인"
      >
        {loading === 'naver' ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <svg className="social-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.273 12.04L7.376 0H0v20h7.727V7.96l8.897 12.04H20V0h-3.727v12.04z" fill="currentColor"/>
            </svg>
            네이버로 계속하기
          </>
        )}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="divider">
        <span>— 또는 —</span>
      </div>

      <button
        type="button"
        onClick={onSwitchToEmail}
        className="social-auth-button email"
        aria-label="이메일로 로그인"
      >
        <svg className="social-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" fill="currentColor"/>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" fill="currentColor"/>
        </svg>
        이메일로 계속하기
      </button>
    </div>
  );
} 