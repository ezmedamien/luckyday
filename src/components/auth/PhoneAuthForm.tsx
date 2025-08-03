"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PhoneAuthForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendOTP, verifyOTP } = useAuth();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as 010-1234-5678
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await sendOTP(phone);
    
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('6자리 인증번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await verifyOTP(phone, otp);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    const { error } = await sendOTP(phone);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="phone-auth-form">
      {!otpSent ? (
        <form onSubmit={handleSendOTP} className="auth-form">
          <div className="form-group">
            <label htmlFor="phone" className="form-label">휴대폰 번호</label>
            <div className="phone-input-container">
              <span className="country-code">+82</span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className="form-input phone-input"
                placeholder="010-1234-5678"
                maxLength={13}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone || phone.length < 10}
            className="auth-button primary"
          >
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>전송 중...</span>
              </div>
            ) : (
              '인증번호 받기'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="auth-form">
          <div className="form-group">
            <label htmlFor="otp" className="form-label">인증번호</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              className="form-input otp-input"
              placeholder="000000"
              maxLength={6}
              required
            />
            <div className="otp-info">
              <span className="phone-display">{phone}</span>로 인증번호가 전송되었습니다.
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !otp || otp.length !== 6}
            className="auth-button primary"
          >
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>확인 중...</span>
              </div>
            ) : (
              '확인'
            )}
          </button>

          <div className="auth-links">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="link-button"
            >
              인증번호 다시 받기
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
              }}
              className="link-button"
            >
              번호 변경
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 