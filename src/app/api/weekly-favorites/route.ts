import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAccess, createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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
    
    // Get the start of the current week (Monday)
    const getWeekStart = (date: Date = new Date()): string => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    const weekStart = getWeekStart();
    
    const { data, error } = await supabase
      .from('weekly_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .order('used_count', { ascending: false })
      .order('added_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch weekly favorites',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data: data || [],
      weekStart
    });

  } catch (error) {
    console.error('Weekly favorites error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, numbers } = await request.json();
    
    if (!userId || !numbers) {
      return NextResponse.json({ 
        error: 'User ID and numbers are required' 
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
    
    // Get the start of the current week (Monday)
    const getWeekStart = (date: Date = new Date()): string => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    const weekStart = getWeekStart();
    
    // Check if this combination already exists for this week
    const { data: existing } = await supabase
      .from('weekly_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .eq('numbers', numbers)
      .single();

    let result;
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

      if (error) {
        return NextResponse.json({ 
          error: 'Failed to update weekly favorite',
          details: error.message
        }, { status: 500 });
      }

      result = data;
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

      if (error) {
        return NextResponse.json({ 
          error: 'Failed to create weekly favorite',
          details: error.message
        }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ 
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Weekly favorites POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, numbers } = await request.json();
    
    if (!userId || !numbers) {
      return NextResponse.json({ 
        error: 'User ID and numbers are required' 
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
    
    // Get the start of the current week (Monday)
    const getWeekStart = (date: Date = new Date()): string => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    const weekStart = getWeekStart();
    
    const { error } = await supabase
      .from('weekly_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .eq('numbers', numbers);

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to remove weekly favorite',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Weekly favorite removed successfully'
    });

  } catch (error) {
    console.error('Weekly favorites DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
} 