"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Check if click is inside the menu button
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      
      // Check if click is inside the dropdown (portal)
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      
      // Check if click is inside the modal
      const modalElement = document.querySelector('[data-modal="delete-confirm"]');
      if (modalElement && modalElement.contains(target)) {
        return;
      }
      
      // If click is outside all of the above, close the dropdown
      setIsOpen(false);
      setShowDeleteConfirm(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 280, // 280px is the dropdown width
        width: 280
      });
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      console.log('로그아웃 시작...');
      setIsSigningOut(true);
      await signOut();
      console.log('로그아웃 완료');
      setIsOpen(false);
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      console.log('계정 삭제 시작...');
      setIsDeleting(true);
      
      // First, delete user data from the database
      console.log('사용자 데이터 삭제 중...');
      const { error: dataError } = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json());

      if (dataError) {
        console.error('데이터 삭제 오류:', dataError);
        throw new Error(dataError);
      }
      console.log('사용자 데이터 삭제 완료');

      // Then delete the user account from Supabase Auth
      console.log('인증 계정 삭제 중...');
      const { error: authError } = await fetch('/api/user/delete-auth', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json());

      if (authError) {
        console.error('인증 삭제 오류:', authError);
        // If service role key is not configured, show helpful message
        if (authError.includes('서버 설정이 완료되지 않았습니다')) {
          alert('계정 삭제 기능이 아직 설정되지 않았습니다. 관리자에게 문의하세요.');
          setIsDeleting(false);
          setShowDeleteConfirm(false);
          return;
        }
        throw new Error(authError);
      }
      console.log('인증 계정 삭제 완료');

      // Sign out after successful deletion
      await signOut();
      setIsOpen(false);
      setShowDeleteConfirm(false);
      
      // Show success message
      alert('계정이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('계정 삭제 중 오류가 발생했습니다:', error);
      alert('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="user-menu-container" ref={menuRef}>
        <button
          className="user-menu-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="사용자 메뉴"
        >
          <div className="user-avatar">
            {getInitials(user?.email || '')}
          </div>
          <span className="user-email">{user?.email}</span>
          <svg
            className={`user-menu-arrow ${isOpen ? 'rotated' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Render dropdown at document level with highest z-index */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '1rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 2147483647, // Maximum z-index value
            padding: '1rem'
          }}
        >
          <div className="user-menu-header">
            <div className="user-info">
              <div className="user-avatar-small">
                {getInitials(user?.email || '')}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.email}</div>
                <div className="user-joined">
                  가입일: {new Date(user?.created_at || '').toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="user-menu-actions">
            <button
              className="user-menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('프로필 페이지로 이동...');
                router.push('/profile');
                setIsOpen(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                  fill="currentColor"
                />
              </svg>
              프로필
            </button>
            
            <button
              className="user-menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('로그아웃 버튼 클릭됨');
                handleSignOut();
              }}
              disabled={isSigningOut}
              style={{ cursor: isSigningOut ? 'not-allowed' : 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 12H2V2H6M6 12L10 8L6 4M10 8H2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isSigningOut ? '로그아웃 중...' : '로그아웃'}
            </button>

            <button
              className="user-menu-item user-menu-item-danger"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('계정 삭제 버튼 클릭됨');
                setShowDeleteConfirm(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              계정 삭제
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          data-modal="delete-confirm"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 2147483646, // Just below the dropdown
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: '#fef2f2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '2px solid #fecaca'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                계정 삭제
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
                정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 저장된 번호와 데이터가 영구적으로 삭제됩니다.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }
                }}
              >
                {isDeleting ? '삭제 중...' : '계정 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 