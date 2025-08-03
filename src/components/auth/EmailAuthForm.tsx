"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailAuthFormProps {
  onSwitchToResetPassword: () => void;
}

export default function EmailAuthForm({ onSwitchToResetPassword }: EmailAuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, signUp } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('이메일 주소를 입력해주세요.');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setError('');

    const { error } = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);
    
    if (error) {
      setError(error.message);
      // If sign up fails, try sign in
      if (isSignUp && error.message.includes('already registered')) {
        setIsSignUp(false);
      }
    }
    
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmailError('');
    setPasswordError('');
  };

  return (
    <div className="email-auth-form">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">이메일 주소</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            className={`form-input ${emailError ? 'error' : ''}`}
            placeholder="example@email.com"
            required
          />
          {emailError && (
            <div className="field-error">
              {emailError}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className={`form-input ${passwordError ? 'error' : ''}`}
            placeholder="최소 6자"
            required
          />
          {passwordError && (
            <div className="field-error">
              {passwordError}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password || !!emailError || !!passwordError}
          className="auth-button primary"
        >
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>{isSignUp ? '가입 중...' : '로그인 중...'}</span>
            </div>
          ) : (
            '계속'
          )}
        </button>

        <div className="auth-links">
          <button
            type="button"
            onClick={toggleMode}
            className="link-button"
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
          {!isSignUp && (
            <button
              type="button"
              onClick={onSwitchToResetPassword}
              className="link-button"
            >
              비밀번호를 잊으셨나요?
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 