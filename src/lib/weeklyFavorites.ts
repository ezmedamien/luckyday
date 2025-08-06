import { supabase } from './supabase';

export interface WeeklyFavorite {
  id: string;
  user_id: string;
  numbers: number[];
  week_start: string;
  added_at: string;
  used_count: number;
  last_used_at?: string;
  created_at: string;
}

// Get the start of the current week (Monday)
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Get the start of a specific week
export function getWeekStartFromDate(date: Date): string {
  return getWeekStart(date);
}

export async function getWeeklyFavorites(userId: string, weekStart?: string): Promise<{ data: WeeklyFavorite[] | null; error: Error | null }> {
  try {
    const week = weekStart || getWeekStart();
    
    const { data, error } = await supabase
      .from('weekly_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', week)
      .order('used_count', { ascending: false })
      .order('added_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function addToWeeklyFavorites(
  userId: string, 
  numbers: number[]
): Promise<{ data: WeeklyFavorite | null; error: Error | null }> {
  try {
    const weekStart = getWeekStart();
    
    // Check if this combination already exists for this week
    const { data: existing } = await supabase
      .from('weekly_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .eq('numbers', numbers)
      .single();

    if (existing) {
      // Update the existing entry
      const { data, error } = await supabase
        .from('weekly_favorites')
        .update({
          used_count: existing.used_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      return { data, error };
    } else {
      // Create a new entry
      const { data, error } = await supabase
        .from('weekly_favorites')
        .insert([{
          user_id: userId,
          numbers,
          week_start: weekStart,
          used_count: 1,
          last_used_at: new Date().toISOString()
        }])
        .select()
        .single();

      return { data, error };
    }
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function removeFromWeeklyFavorites(
  userId: string, 
  numbers: number[]
): Promise<{ error: Error | null }> {
  try {
    const weekStart = getWeekStart();
    
    const { error } = await supabase
      .from('weekly_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .eq('numbers', numbers);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getWeeklyFavoritesStats(userId: string): Promise<{ data: any | null; error: Error | null }> {
  try {
    const weekStart = getWeekStart();
    
    const { data, error } = await supabase
      .from('weekly_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart);

    if (error) {
      return { data: null, error };
    }

    const stats = {
      totalCombinations: data?.length || 0,
      totalUsage: data?.reduce((sum, item) => sum + item.used_count, 0) || 0,
      mostUsed: data?.sort((a, b) => b.used_count - a.used_count)[0] || null
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
} 