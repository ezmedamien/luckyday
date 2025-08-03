import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedCombos, saveCombo, deleteSavedCombo, updateSavedCombo } from '@/lib/savedCombos';
import { SavedCombo } from '@/lib/supabase';

export function useSavedCombos() {
  const { user } = useAuth();
  const [savedCombos, setSavedCombos] = useState<SavedCombo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved combinations when user changes
  useEffect(() => {
    if (user) {
      loadSavedCombos();
    } else {
      setSavedCombos([]);
    }
  }, [user]);

  const loadSavedCombos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getSavedCombos(user.id);
      
      if (error) {
        setError(error.message);
      } else {
        setSavedCombos(data || []);
      }
    } catch (err) {
      setError('저장된 번호를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addSavedCombo = useCallback(async (numbers: number[], method: string, description?: string) => {
    if (!user) {
      console.log('No user found, cannot save combo');
      return;
    }

    console.log('Attempting to save combo:', { numbers, method, description, userId: user.id });
    setLoading(true);
    setError(null);

    try {
      const { error } = await saveCombo(user.id, numbers, method, description);
      
      if (error) {
        console.error('Error saving combo:', error);
        setError(error.message);
      } else {
        console.log('Combo saved successfully, reloading list...');
        // Reload the list to get the new item with its ID
        await loadSavedCombos();
      }
    } catch (err) {
      console.error('Exception while saving combo:', err);
      setError('번호를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, loadSavedCombos]);

  const removeSavedCombo = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await deleteSavedCombo(id);
      
      if (error) {
        setError(error.message);
      } else {
        setSavedCombos(prev => prev.filter(combo => combo.id !== id));
      }
    } catch (err) {
      setError('번호를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCombo = useCallback(async (id: string, updates: Partial<SavedCombo>) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await updateSavedCombo(id, updates);
      
      if (error) {
        setError(error.message);
      } else {
        setSavedCombos(prev => 
          prev.map(combo => 
            combo.id === id ? { ...combo, ...updates } : combo
          )
        );
      }
    } catch (err) {
      setError('번호를 업데이트하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    savedCombos,
    loading,
    error,
    addSavedCombo,
    removeSavedCombo,
    updateCombo,
    refresh: loadSavedCombos
  };
} 