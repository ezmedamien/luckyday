"use client";

import React, { useState } from 'react';
import PhoneAuthForm from './PhoneAuthForm';
import SocialAuthButtons from './SocialAuthButtons';
import EmailAuthForm from './EmailAuthForm';
import ResetPasswordForm from './ResetPasswordForm';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'phone' | 'social' | 'email' | 'reset';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<AuthMode>('phone');
  const [activeTab, setActiveTab] = useState<'phone' | 'social'>('phone');

  if (!authModalOpen) return null;

  const renderContent = () => {
    switch (mode) {
      case 'phone':
        return <PhoneAuthForm />;
      case 'social':
        return (
          <SocialAuthButtons
            onSwitchToEmail={() => setMode('email')}
          />
        );
      case 'email':
        return (
          <EmailAuthForm
            onSwitchToResetPassword={() => setMode('reset')}
          />
        );
      case 'reset':
        return (
          <ResetPasswordForm
            onSwitchToLogin={() => setMode('email')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="auth-modal-header">
          <h2 className="auth-title">당신만의 저장소를 잠금 해제하세요</h2>
          <p className="auth-subtitle">복권 번호를 저장하고, 다시 확인해 보세요.</p>
        </div>

        {/* Tab Navigation */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('phone');
              setMode('phone');
            }}
          >
            휴대폰 인증
          </button>
          <button
            className={`auth-tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('social');
              setMode('social');
            }}
          >
            소셜/이메일
          </button>
        </div>

        {/* Tab Content */}
        <div className="auth-tab-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 