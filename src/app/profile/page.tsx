"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SavedCombo {
  id: string;
  numbers: number[];
  saved_at: string;
  method: string;
  description?: string;
}

export default function ProfilePage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [savedCombos, setSavedCombos] = useState<SavedCombo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedCombos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saved_combos')
        .select('*')
        .eq('user_id', user?.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('저장된 조합을 불러오는 중 오류가 발생했습니다:', error);
        return;
      }

      setSavedCombos(data || []);
    } catch (error) {
      console.error('저장된 조합을 불러오는 중 오류가 발생했습니다:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      fetchSavedCombos();
    }
  }, [user, authLoading, router, fetchSavedCombos]);

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-050 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600 body-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-050">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="btn-icon"
              aria-label="홈으로 돌아가기"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 10H5M5 10L10 15M5 10L10 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="heading-lg text-gray-900">프로필</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Two Column Layout using new CSS classes */}
        <div className="profile-layout">
          {/* Left Column - User Info and Payment */}
          <div className="profile-left space-y-8">
            {/* User Info Card */}
            <div className="card profile-card">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(user.email || '')}
                </div>
                <div className="flex-1">
                  <h2 className="heading-md text-gray-900">{user.email}</h2>
                  <p className="body-sm text-gray-600 mt-1">
                    가입일: {new Date(user.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="card profile-card">
              <h3 className="heading-md text-gray-900 mb-6">결제 정보</h3>
              <div className="bg-gray-050 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <h4 className="heading-md text-gray-900 mb-2">프리미엄 기능</h4>
                <p className="text-gray-600 body-sm mb-6">
                  곧 프리미엄 기능이 출시될 예정입니다. 결제 정보를 등록하여 특별한 혜택을 받아보세요!
                </p>
                <button className="btn-primary">
                  곧 출시 예정
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Saved Combos Section */}
          <div className="profile-right">
            <div className="card profile-card">
              <h3 className="heading-md text-gray-900 mb-6">저장된 번호 조합</h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto"></div>
                  <p className="mt-4 text-gray-600 body-sm">저장된 조합을 불러오는 중...</p>
                </div>
              ) : savedCombos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <path d="M9 12l2 2 4-4M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <p className="text-gray-500 body-lg">아직 저장된 번호 조합이 없습니다.</p>
                  <p className="text-gray-400 body-sm mt-2">메인 페이지에서 번호를 생성하고 저장해보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedCombos.map((combo) => (
                    <div key={combo.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="body-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {combo.method}
                          </span>
                          {combo.description && (
                            <span className="text-xs text-gray-400">({combo.description})</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(combo.saved_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {combo.numbers.map((number, index) => (
                          <div
                            key={index}
                            className="number-ball"
                          >
                            {number}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 