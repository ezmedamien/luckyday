"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onSwitchToResetPassword: () => void;
}

export default function LoginForm({ onSwitchToSignUp, onSwitchToResetPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-title">로그인</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="이메일을 입력하세요"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-button primary"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="auth-links">
          <button
            type="button"
            onClick={onSwitchToResetPassword}
            className="link-button"
          >
            비밀번호를 잊으셨나요?
          </button>
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="link-button"
          >
            계정이 없으신가요? 회원가입
          </button>
        </div>
      </form>
    </div>
  );
} 