"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  authModalOpen: boolean;
  returnTo: string | null;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  
  // Phone OTP methods
  sendOTP: (phone: string) => Promise<{ error: any }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: any }>;
  
  // Social auth methods
  signInWithProvider: (provider: 'kakao' | 'naver') => Promise<{ error: any }>;
  
  // Modal management
  openAuthModal: (returnTo?: string) => void;
  closeAuthModal: () => void;
  
  // Guest flow
  saveAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const router = useRouter();

  const isGuest = !user && !loading;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle successful authentication
      if (event === 'SIGNED_IN' && session?.user) {
        // Close auth modal
        setAuthModalOpen(false);
        
        // Redirect to returnTo if specified
        if (returnTo) {
          router.push(returnTo);
          setReturnTo(null);
        }
        
        // Show welcome toast (you can implement this with a toast library)
        const userName = session.user.user_metadata?.full_name || '님';
        console.log(`환영합니다, ${userName}! 마지막 번호가 여기에 있어요.`);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, returnTo]);

  const openAuthModal = (returnToPath?: string) => {
    setReturnTo(returnToPath || window.location.pathname);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setReturnTo(null);
  };

  const saveAsGuest = () => {
    openAuthModal();
  };

  // Email/Password auth
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  // Phone OTP auth
  const sendOTP = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.startsWith('+') ? phone : `+82${phone.replace(/^0/, '')}`,
    });
    return { error };
  };

  const verifyOTP = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.startsWith('+') ? phone : `+82${phone.replace(/^0/, '')}`,
      token,
      type: 'sms',
    });
    return { error };
  };

  // Social auth
  const signInWithProvider = async (provider: 'kakao' | 'naver') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any, // Type assertion for custom providers
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    isGuest,
    authModalOpen,
    returnTo,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendOTP,
    verifyOTP,
    signInWithProvider,
    openAuthModal,
    closeAuthModal,
    saveAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 