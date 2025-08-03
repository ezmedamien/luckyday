"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authLoading: boolean;
  isGuest: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  sendOTP: (phone: string) => Promise<{ error: AuthError | null }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ error: AuthError | null }>;
  signInWithProvider: (provider: 'kakao' | 'naver') => Promise<{ error: AuthError | null }>;
  saveAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
        setAuthLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session) {
          setUser(session.user);
          setIsGuest(false);
        } else {
          setUser(null);
          setIsGuest(false);
        }
        
        setLoading(false);
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    }
  };

  const sendOTP = async (phone: string) => {
    try {
      // For now, return success (placeholder implementation)
      // In a real app, you would integrate with SMS service
      console.log('Sending OTP to:', phone);
      return { error: null };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { error: error as AuthError };
    }
  };

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      // For now, return success (placeholder implementation)
      // In a real app, you would verify the OTP
      console.log('Verifying OTP:', phone, otp);
      return { error: null };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { error: error as AuthError };
    }
  };

  const signInWithProvider = async (provider: 'kakao' | 'naver') => {
    try {
      // For now, return success (placeholder implementation)
      // In a real app, you would integrate with OAuth providers
      console.log('Signing in with provider:', provider);
      return { error: null };
    } catch (error) {
      console.error('Social sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const saveAsGuest = () => {
    setIsGuest(true);
    setUser({
      id: 'guest',
      email: 'guest@luckyday.com',
      created_at: new Date().toISOString(),
    } as User);
  };

  const openAuthModal = () => {
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const value = {
    user,
    loading,
    authLoading,
    isGuest,
    authModalOpen,
    openAuthModal,
    closeAuthModal,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendOTP,
    verifyOTP,
    signInWithProvider,
    saveAsGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 