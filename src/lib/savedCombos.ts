import { supabase, SavedCombo } from './supabase';

export async function saveCombo(userId: string, numbers: number[], method: string, description?: string): Promise<{ error: any }> {
  console.log('saveCombo called with:', { userId, numbers, method, description });
  
  const { error } = await supabase
    .from('saved_combos')
    .insert({
      user_id: userId,
      numbers,
      saved_at: new Date().toISOString(),
      method,
      description
    });

  console.log('saveCombo result:', { error });
  return { error };
}

export async function getSavedCombos(userId: string): Promise<{ data: SavedCombo[] | null, error: any }> {
  const { data, error } = await supabase
    .from('saved_combos')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  return { data, error };
}

export async function deleteSavedCombo(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('saved_combos')
    .delete()
    .eq('id', id);

  return { error };
}

export async function updateSavedCombo(id: string, updates: Partial<SavedCombo>): Promise<{ error: any }> {
  const { error } = await supabase
    .from('saved_combos')
    .update(updates)
    .eq('id', id);

  return { error };
} 