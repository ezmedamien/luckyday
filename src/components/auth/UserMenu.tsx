"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
      
      // If click is outside all of the above, close the dropdown
      setIsOpen(false);
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
      {isOpen && createPortal(
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
          </div>
        </div>,
        document.body
      )}
    </>
  );
} 