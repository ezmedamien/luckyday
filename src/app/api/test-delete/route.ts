import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAccess, createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId, comboId } = await request.json();
    
    if (!userId || !comboId) {
      return NextResponse.json({ 
        error: 'User ID and Combo ID are required' 
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

    // Test 1: Check if the combo exists
    const { data: existingCombos, error: selectError } = await supabase
      .from('saved_combos')
      .select('*')
      .eq('id', comboId)
      .eq('user_id', userId);

    if (selectError) {
      return NextResponse.json({ 
        error: 'Error checking combo existence',
        details: selectError.message,
        code: selectError.code
      }, { status: 500 });
    }

    if (!existingCombos || existingCombos.length === 0) {
      return NextResponse.json({ 
        error: 'Combo not found or access denied',
        comboId,
        userId,
        foundCount: existingCombos?.length || 0
      }, { status: 404 });
    }

    if (existingCombos.length > 1) {
      console.warn(`Multiple combos found with same ID: ${comboId}, count: ${existingCombos.length}`);
    }

    const existingCombo = existingCombos[0]; // Take the first one

    // Test 2: Try to delete the combo
    const { data: deleteResult, error: deleteError } = await supabase
      .from('saved_combos')
      .delete()
      .eq('id', comboId)
      .eq('user_id', userId)
      .select();

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Delete operation failed',
        details: deleteError.message,
        code: deleteError.code
      }, { status: 500 });
    }

    // Check if anything was actually deleted
    if (!deleteResult || deleteResult.length === 0) {
      return NextResponse.json({ 
        error: 'No rows were deleted',
        details: 'The combo might have already been deleted or you don\'t have permission',
        comboId,
        userId
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Combo deleted successfully',
      deletedCombo: existingCombo,
      deletedCount: deleteResult.length,
      comboId,
      userId
    });

  } catch (error) {
    console.error('Test delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test database connection and permissions
    const { data, error } = await supabase
      .from('saved_combos')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        error: 'Database connection test failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database connection successful',
      canAccess: true
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error
    }, { status: 500 });
  }
} 