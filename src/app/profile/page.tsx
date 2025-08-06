"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WeeklyFavorite } from '@/lib/weeklyFavorites';

interface SavedCombo {
  id: string;
  numbers: number[];
  saved_at: string;
  method: string;
  description?: string;
}

interface GroupedCombos {
  date: string;
  combos: SavedCombo[];
}

export default function ProfilePage() {
  const { user, authLoading, signOut } = useAuth();
  const router = useRouter();
  const [savedCombos, setSavedCombos] = useState<SavedCombo[]>([]);
  const [weeklyFavorites, setWeeklyFavorites] = useState<WeeklyFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedCombos, setGroupedCombos] = useState<GroupedCombos[]>([]);
  const [clickedCombos, setClickedCombos] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchWeeklyFavorites = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('Fetching weekly favorites for user:', user.id);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('인증 세션이 만료되었습니다.');
        return;
      }

      console.log('Making fetch request to weekly-favorites API...');
      const response = await fetch(`/api/weekly-favorites?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      console.log('Weekly favorites API response:', result);

      if (!response.ok) {
        console.error('주간 즐겨찾기를 불러오는 중 오류가 발생했습니다:', result);
        return;
      }

      console.log('Setting weekly favorites:', result.data);
      setWeeklyFavorites(result.data || []);
    } catch (error) {
      console.error('주간 즐겨찾기를 불러오는 중 오류가 발생했습니다:', error);
    }
  }, [user?.id]);

  // Group combos by date
  useEffect(() => {
    if (savedCombos.length > 0) {
      const grouped = savedCombos.reduce((acc, combo) => {
        const date = new Date(combo.saved_at).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const existingGroup = acc.find(group => group.date === date);
        if (existingGroup) {
          existingGroup.combos.push(combo);
        } else {
          acc.push({ date, combos: [combo] });
        }
        return acc;
      }, [] as GroupedCombos[]);
      
      setGroupedCombos(grouped);
    } else {
      setGroupedCombos([]);
    }
  }, [savedCombos]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      fetchSavedCombos();
      fetchWeeklyFavorites();
    }
  }, [user, authLoading, router, fetchSavedCombos, fetchWeeklyFavorites]);

  // Debug: Monitor weeklyFavorites state changes
  useEffect(() => {
    console.log('weeklyFavorites state changed:', weeklyFavorites);
  }, [weeklyFavorites]);

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  // Check if a combination is in weekly favorites
  const isInWeeklyFavorites = (numbers: number[]) => {
    const comboString = numbers.sort((a, b) => a - b).join(',');
    return weeklyFavorites.some(fav => 
      fav.numbers.sort((a, b) => a - b).join(',') === comboString
    );
  };

  // Get weekly usage count for a combination
  const getWeeklyUsageCount = (numbers: number[]) => {
    const comboString = numbers.sort((a, b) => a - b).join(',');
    const favorite = weeklyFavorites.find(fav => 
      fav.numbers.sort((a, b) => a - b).join(',') === comboString
    );
    return favorite?.used_count || 0;
  };

  // Handle clicking on a combination
  const handleComboClick = async (combo: SavedCombo) => {
    if (!user?.id) return;

    const comboString = combo.numbers.sort((a, b) => a - b).join(',');
    console.log('Combo clicked:', combo.numbers);
    setClickedCombos(prev => new Set([...prev, comboString]));

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }

      const isInFavorites = isInWeeklyFavorites(combo.numbers);
      const method = isInFavorites ? 'DELETE' : 'POST';
      
      console.log('Making request:', {
        method,
        isInFavorites,
        numbers: combo.numbers,
        userId: user.id
      });

      const response = await fetch('/api/weekly-favorites', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          numbers: combo.numbers
        })
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        console.error('주간 즐겨찾기 업데이트 중 오류가 발생했습니다:', result);
        alert(`업데이트 중 오류가 발생했습니다: ${result.error}`);
        return;
      }
      
      console.log('Success! Refreshing weekly favorites...');
      // Refresh weekly favorites
      await fetchWeeklyFavorites();
      console.log('Weekly favorites refreshed');
      
      // Debug: Check the current state after refresh
      console.log('Current weeklyFavorites state after refresh:', weeklyFavorites);
    } catch (error) {
      console.error('주간 즐겨찾기 업데이트 중 오류가 발생했습니다:', error);
      alert('업데이트 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      // Remove from clicked state after a delay
      setTimeout(() => {
        setClickedCombos(prev => {
          const newSet = new Set(prev);
          newSet.delete(comboString);
          return newSet;
        });
      }, 500);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Handle delete saved combo
  const handleDeleteSavedCombo = async (comboId: string) => {
    if (!user?.id) return;
    
    if (!confirm('이 저장된 조합을 삭제하시겠습니까?')) return;
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }

      // Use the API endpoint for better error handling
      const response = await fetch('/api/test-delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          userId: user.id, 
          comboId: comboId 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('저장된 조합 삭제 중 오류가 발생했습니다:', result);
        alert(`삭제 중 오류가 발생했습니다: ${result.error}`);
        return;
      }

      // Refresh saved combos
      await fetchSavedCombos();
      alert('저장된 조합이 삭제되었습니다.');
    } catch (error) {
      console.error('저장된 조합 삭제 중 오류가 발생했습니다:', error);
      alert('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // Handle delete weekly favorite
  const handleDeleteWeeklyFavorite = async (numbers: number[]) => {
    if (!user?.id) return;
    
    if (!confirm('이 주간 즐겨찾기를 제거하시겠습니까?')) return;
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await fetch('/api/weekly-favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id,
          numbers: numbers
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('주간 즐겨찾기 제거 중 오류가 발생했습니다:', result);
        alert(`제거 중 오류가 발생했습니다: ${result.error}`);
        return;
      }

      // Refresh weekly favorites
      await fetchWeeklyFavorites();
      alert('주간 즐겨찾기가 제거되었습니다.');
    } catch (error) {
      console.error('주간 즐겨찾기 제거 중 오류가 발생했습니다:', error);
      alert('제거 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    
    setIsDeleting(true);
    try {
      // Delete user data from database
      const deleteDataResponse = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!deleteDataResponse.ok) {
        throw new Error('Failed to delete user data');
      }

      // Delete auth account
      const deleteAuthResponse = await fetch('/api/user/delete-auth', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!deleteAuthResponse.ok) {
        throw new Error('Failed to delete auth account');
      }

      // Sign out and redirect
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('계정 삭제 중 오류가 발생했습니다:', error);
      alert('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
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
          <div className="profile-left">
            {/* User Info Card */}
            <div className="card profile-card">
              <div className="flex items-center space-x-4 mb-6">
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

              {/* Account Actions */}
              <div className="space-y-3 border-t pt-6">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  {isSigningOut ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      <span>로그아웃 중...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 12l4-4-4-4M10 8H2"/>
                      </svg>
                      <span>로그아웃</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex items-center justify-center space-x-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 4h12M5 4V2a1 1 0 011-1h4a1 1 0 011 1v2M8 11v3M5 11v3"/>
                  </svg>
                  <span>계정 삭제</span>
                </button>
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
                             <div className="flex items-center justify-between mb-6">
                 <h3 className="heading-md text-gray-900">저장된 번호 조합</h3>
                                   <div className="flex space-x-2">
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/test-db');
                          const result = await response.json();
                          console.log('DB test result:', result);
                          alert(JSON.stringify(result, null, 2));
                        } catch (error) {
                          console.error('DB test error:', error);
                          alert('DB test failed: ' + error);
                        }
                      }}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Test DB
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          // Get the current session
                          const { data: { session } } = await supabase.auth.getSession();
                          
                          console.log('Client-side session check:', {
                            hasSession: !!session,
                            hasAccessToken: !!session?.access_token,
                            tokenLength: session?.access_token?.length || 0
                          });
                          
                          if (!session) {
                            alert('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
                            return;
                          }

                          if (!session.access_token) {
                            alert('Access token is missing from session');
                            return;
                          }

                          console.log('Sending request with token...');
                          const response = await fetch('/api/test-auth', {
                            headers: {
                              'Authorization': `Bearer ${session.access_token}`
                            }
                          });
                          const result = await response.json();
                          console.log('Auth test result:', result);
                          alert(JSON.stringify(result, null, 2));
                        } catch (error) {
                          console.error('Auth test error:', error);
                          alert('Auth test failed: ' + error);
                        }
                      }}
                      className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
                    >
                      Test Auth
                    </button>
                                         <button 
                                               onClick={async () => {
                          if (!user?.id) {
                            alert('No user ID available');
                            return;
                          }
                          try {
                            // Get the current session
                            const { data: { session } } = await supabase.auth.getSession();
                            
                            if (!session) {
                              alert('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
                              return;
                            }

                            const response = await fetch(`/api/debug-combos?userId=${user.id}`, {
                              headers: {
                                'Authorization': `Bearer ${session.access_token}`
                              }
                            });
                            const result = await response.json();
                            console.log('Debug combos result:', result);
                            alert(JSON.stringify(result, null, 2));
                          } catch (error) {
                            console.error('Debug combos error:', error);
                            alert('Debug failed: ' + error);
                          }
                        }}
                       className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                     >
                       Debug Combos
                     </button>
                     <button 
                                               onClick={async () => {
                          if (!user?.id || savedCombos.length === 0) {
                            alert('No saved combos to test with');
                            return;
                          }
                          try {
                            const testCombo = savedCombos[0];
                            console.log('Testing delete for combo:', testCombo);
                            
                            // Get the current session
                            const { data: { session } } = await supabase.auth.getSession();
                            
                            if (!session) {
                              alert('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
                              return;
                            }

                            const response = await fetch(`/api/debug-combos?userId=${user.id}&comboId=${testCombo.id}`, {
                              headers: {
                                'Authorization': `Bearer ${session.access_token}`
                              }
                            });
                            const result = await response.json();
                            console.log('Debug specific combo result:', result);
                            alert(JSON.stringify(result, null, 2));
                          } catch (error) {
                            console.error('Debug specific combo error:', error);
                            alert('Debug failed: ' + error);
                          }
                        }}
                       className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                     >
                       Debug First Combo
                     </button>
                                         <button 
                                               onClick={async () => {
                          if (!user?.id || savedCombos.length === 0) {
                            alert('No saved combos to test with');
                            return;
                          }
                          try {
                            const testCombo = savedCombos[0];
                            console.log('Current user ID:', user.id);
                            console.log('Test combo ID:', testCombo.id);
                            
                            // Get the current session
                            const { data: { session } } = await supabase.auth.getSession();
                            
                            if (!session) {
                              alert('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
                              return;
                            }

                            const response = await fetch('/api/test-delete', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                              },
                              body: JSON.stringify({ 
                                userId: user.id, 
                                comboId: testCombo.id 
                              })
                            });
                            const result = await response.json();
                            console.log('Delete test result:', result);
                            alert(JSON.stringify(result, null, 2));
                          } catch (error) {
                            console.error('Delete test error:', error);
                            alert('Delete test failed: ' + error);
                          }
                        }}
                       className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                     >
                       Test Delete
                     </button>
                  </div>
               </div>

              {/* Weekly Summary */}
              {weeklyFavorites.length > 0 ? (
                <div className="mb-6 p-4 bg-green-100 border-2 border-green-300 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-green-900">이번 주 선택</h4>
                                         <span className="badge badge-sm bg-green-200 text-green-800 font-medium">
                       {weeklyFavorites.length}개
                     </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                                         {weeklyFavorites.slice(0, 3).map((favorite, index) => (
                       <div key={favorite.id} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border-2 border-green-400 shadow-md">
                         <div className="flex space-x-1">
                           {favorite.numbers.slice(0, 3).map((number, numIndex) => (
                             <div key={numIndex} className="number-ball number-ball-sm bg-green-600">
                               {number}
                             </div>
                           ))}
                           {favorite.numbers.length > 3 && (
                             <span className="text-xs text-green-700 font-bold">+{favorite.numbers.length - 3}</span>
                           )}
                         </div>
                         <span className="badge badge-sm bg-green-200 text-green-800 font-bold">
                           {favorite.used_count}회
                         </span>
                                                   <button
                            onClick={() => handleDeleteWeeklyFavorite(favorite.numbers)}
                            className="delete-btn delete-btn-sm"
                            title="주간 즐겨찾기에서 제거"
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 3h6M3 3V1a1 1 0 011-1h0a1 1 0 011 1v2M5 9v2M3 9v2"/>
                            </svg>
                          </button>
                       </div>
                     ))}
                    {weeklyFavorites.length > 3 && (
                      <div className="text-xs text-green-600 font-medium">
                        +{weeklyFavorites.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                      <path d="M8 4v8M4 8h8"/>
                    </svg>
                    <span className="text-sm text-gray-600">이번 주 선택한 번호가 없습니다</span>
                  </div>
                </div>
              )}

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
                <div className="space-y-8">
                  {groupedCombos.slice(0, 10).map((group, groupIndex) => (
                    <div key={group.date} className="space-y-4">
                      {/* Date Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="heading-md text-gray-900">{group.date}</h4>
                        <span className="text-sm text-gray-500">{group.combos.length}개 조합</span>
                      </div>
                      
                      {/* Horizontal Scroll Container */}
                      <div className="overflow-x-auto">
                        <div className="flex space-x-4 pb-2" style={{ minWidth: 'max-content' }}>
                          {group.combos.map((combo) => {
                            const comboString = combo.numbers.sort((a, b) => a - b).join(',');
                            const isClicked = clickedCombos.has(comboString);
                            const isInFavorites = isInWeeklyFavorites(combo.numbers);
                            const weeklyUsage = getWeeklyUsageCount(combo.numbers);
                            
                            return (
                              <div 
                                key={combo.id} 
                                className={`flex-shrink-0 rounded-lg p-4 min-w-[280px] cursor-pointer combo-card transition-all duration-200 ${
                                  isClicked 
                                    ? 'active' // Active state
                                    : isInFavorites 
                                      ? 'selected' // Selected state
                                      : '' // Neutral state
                                }`}
                                onClick={() => handleComboClick(combo)}
                                
                              >
                                                                 {/* Usage counter for selected items */}
                                 {isInFavorites && (
                                   <div className="absolute top-2 right-2">
                                     <div className="badge badge-sm badge-success">
                                       {weeklyUsage}회
                                     </div>
                                   </div>
                                 )}
                                
                                                                 <div className="flex items-center justify-between mb-3">
                                   <div className="flex items-center space-x-2">
                                     {isInFavorites ? (
                                       <span className="text-xs text-green-700 font-medium">
                                         이번 주 선택 ✅
                                       </span>
                                     ) : (
                                       <span className="text-xs text-gray-500">
                                         클릭하여 선택 ⬜
                                       </span>
                                     )}
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <span className="text-xs text-gray-400">
                                       {new Date(combo.saved_at).toLocaleTimeString('ko-KR', {
                                         hour: '2-digit',
                                         minute: '2-digit'
                                       })}
                                     </span>
                                                                           <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSavedCombo(combo.id);
                                        }}
                                        className="delete-btn delete-btn-sm"
                                        title="저장된 조합 삭제"
                                      >
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M2 4h6M4 4V2a1 1 0 011-1h0a1 1 0 011 1v2M6 11v3M4 11v3"/>
                                        </svg>
                                      </button>
                                   </div>
                                 </div>
                                <div className="flex flex-wrap gap-2">
                                                                     {combo.numbers.map((number, index) => (
                                     <div
                                       key={index}
                                       className={`number-ball number-ball-md ${
                                         isInFavorites ? 'bg-green-500' : 'bg-blue-500'
                                       }`}
                                     >
                                       {number}
                                     </div>
                                   ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more indicator if there are more than 10 groups */}
                  {groupedCombos.length > 10 && (
                    <div className="text-center py-4">
                      <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="heading-md text-gray-900 mb-4">계정 삭제 확인</h3>
            <p className="text-gray-600 body-sm mb-6">
              정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="spinner w-4 h-4"></div>
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <span>삭제</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 