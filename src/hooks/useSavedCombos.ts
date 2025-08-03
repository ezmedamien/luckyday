"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SavedCombo {
  id: string;
  numbers: number[];
  saved_at: string;
  method: string;
  description?: string;
}

export function useSavedCombos() {
  const { user } = useAuth();
  const [savedCombos, setSavedCombos] = useState<SavedCombo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedCombos = useCallback(async () => {
    if (!user) {
      setSavedCombos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_combos')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error loading saved combinations:', error);
        return;
      }

      setSavedCombos(data || []);
    } catch (error) {
      console.error('Unexpected error loading saved combinations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedCombos();
  }, [loadSavedCombos]);

  const addSavedCombo = useCallback(async (numbers: number[], method: string, description?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_combos')
        .insert([
          {
            user_id: user.id,
            numbers,
            method,
            description,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving combination:', error);
        return;
      }

      setSavedCombos(prev => [data, ...prev]);
    } catch (error) {
      console.error('Unexpected error saving combination:', error);
    }
  }, [user]);

  const removeSavedCombo = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_combos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing saved combination:', error);
        return;
      }

      setSavedCombos(prev => prev.filter(combo => combo.id !== id));
    } catch (error) {
      console.error('Unexpected error removing saved combination:', error);
    }
  }, []);

  return {
    savedCombos,
    addSavedCombo,
    removeSavedCombo,
    loading,
  };
} 