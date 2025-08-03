import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user's saved combinations
    const { error: deleteError } = await supabase
      .from('saved_combos')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting saved combinations:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete account route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 