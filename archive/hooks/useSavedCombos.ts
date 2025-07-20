import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/utils';

export interface SavedCombo {
  id: string;
  numbers: number[];
  method: string;
  date: string;
  name?: string;
}

const STORAGE_KEY = 'luckyday-saved-combos';

export function useSavedCombos() {
  const [combos, setCombos] = useState<SavedCombo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load combos from localStorage
  useEffect(() => {
    try {
      const saved = storage.get(STORAGE_KEY);
      if (saved && Array.isArray(saved)) {
        setCombos(saved);
      }
    } catch (error) {
      console.error('Error loading saved combos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save combo
  const saveCombo = useCallback((combo: Omit<SavedCombo, 'id' | 'date'>) => {
    const newCombo: SavedCombo = {
      ...combo,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      name: combo.name || `${combo.method} - ${new Date().toLocaleDateString()}`
    };

    const updatedCombos = [...combos, newCombo];
    setCombos(updatedCombos);
    
    // Persist to localStorage
    storage.set(STORAGE_KEY, updatedCombos);
    
    return newCombo;
  }, [combos]);

  // Delete combo
  const deleteCombo = useCallback((id: string) => {
    const updatedCombos = combos.filter(combo => combo.id !== id);
    setCombos(updatedCombos);
    storage.set(STORAGE_KEY, updatedCombos);
  }, [combos]);

  // Clear all combos
  const clearAll = useCallback(() => {
    setCombos([]);
    storage.remove(STORAGE_KEY);
  }, []);

  // Get combo by id
  const getCombo = useCallback((id: string) => {
    return combos.find(combo => combo.id === id);
  }, [combos]);

  // Update combo
  const updateCombo = useCallback((id: string, updates: Partial<SavedCombo>) => {
    const updatedCombos = combos.map(combo => 
      combo.id === id ? { ...combo, ...updates } : combo
    );
    setCombos(updatedCombos);
    storage.set(STORAGE_KEY, updatedCombos);
  }, [combos]);

  return {
    combos,
    isLoading,
    saveCombo,
    deleteCombo,
    clearAll,
    getCombo,
    updateCombo,
    count: combos.length
  };
} 