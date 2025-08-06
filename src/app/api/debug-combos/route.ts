import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAccess, createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const comboId = searchParams.get('comboId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Verify user authentication and access
    const authResult = await verifyUserAccess(request, userId);
    if (!authResult.authorized) {
      return NextResponse.json({ 
        error: authResult.error,
        details: authResult.details
      }, { status: 401 });
    }

    const supabase = createServerSupabaseClient(request);

    let query = supabase
      .from('saved_combos')
      .select('*')
      .eq('user_id', userId);

    if (comboId) {
      query = query.eq('id', comboId);
    }

    const { data, error } = await query.order('saved_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      userId,
      comboId: comboId || 'all',
      totalCount: data?.length || 0,
      combos: data || []
    });

  } catch (error) {
    console.error('Debug combos error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
} 