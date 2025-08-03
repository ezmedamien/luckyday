import { supabase } from './supabase';

export interface SavedCombo {
  id: string;
  user_id: string;
  numbers: number[];
  method: string;
  description?: string;
  saved_at: string;
}

export async function getSavedCombos(userId: string): Promise<{ data: SavedCombo[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('saved_combos')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function saveCombo(
  userId: string, 
  numbers: number[], 
  method: string, 
  description?: string
): Promise<{ data: SavedCombo | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('saved_combos')
      .insert([
        {
          user_id: userId,
          numbers,
          method,
          description,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function deleteSavedCombo(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('saved_combos')
      .delete()
      .eq('id', id);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function updateSavedCombo(
  id: string, 
  updates: Partial<Omit<SavedCombo, 'id' | 'user_id' | 'saved_at'>>
): Promise<{ data: SavedCombo | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('saved_combos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
} 