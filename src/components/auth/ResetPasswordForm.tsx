"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ResetPasswordFormProps {
  onSwitchToLogin: () => void;
}

export default function ResetPasswordForm({ onSwitchToLogin }: ResetPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-title">비밀번호 재설정</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="가입한 이메일을 입력하세요"
            required
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-button primary"
        >
          {loading ? '전송 중...' : '비밀번호 재설정 링크 전송'}
        </button>

        <div className="auth-links">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="link-button"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </form>
    </div>
  );
} 