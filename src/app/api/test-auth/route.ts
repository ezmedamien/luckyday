import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH TEST START ===');
    
    // Test 1: Check if we can get the current user
    console.log('Testing getAuthenticatedUser...');
    const { user, error: userError } = await getAuthenticatedUser(request);
    
    console.log('User result:', { user: user?.id, error: userError?.message });
    
    if (userError) {
      console.log('Authentication failed:', userError);
      return NextResponse.json({ 
        error: 'Authentication error',
        details: userError.message,
        code: userError.status || 400,
        step: 'getAuthenticatedUser'
      }, { status: 401 });
    }

    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json({ 
        error: 'No authenticated user found',
        details: 'User is not logged in',
        step: 'user_check'
      }, { status: 401 });
    }

    console.log('User authenticated successfully:', user.id);

    // Test 2: Check if we can access saved_combos table
    console.log('Testing database access...');
    const supabase = createServerSupabaseClient(request);
    
    // First, test a simple query
    const { data: testData, error: testError } = await supabase
      .from('saved_combos')
      .select('count')
      .limit(1);

    console.log('Test query result:', { data: testData, error: testError?.message });

    if (testError) {
      console.log('Database access failed:', testError);
      return NextResponse.json({ 
        error: 'Database access error',
        details: testError.message,
        code: testError.code,
        step: 'database_access'
      }, { status: 500 });
    }

    // Test 3: Check user's own data
    console.log('Testing user-specific data access...');
    const { data: userCombos, error: userCombosError } = await supabase
      .from('saved_combos')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);

    console.log('User combos result:', { 
      count: userCombos?.length || 0, 
      error: userCombosError?.message 
    });

    if (userCombosError) {
      console.log('User data access failed:', userCombosError);
      return NextResponse.json({ 
        error: 'User data access error',
        details: userCombosError.message,
        code: userCombosError.code,
        step: 'user_data_access'
      }, { status: 500 });
    }

    // Test 4: Test the database function
    console.log('Testing database function...');
    const { data: functionResult, error: functionError } = await supabase
      .rpc('test_auth_function');

    console.log('Function test result:', { data: functionResult, error: functionError?.message });

    console.log('=== AUTH TEST SUCCESS ===');
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      database: {
        accessible: true,
        userCombosCount: userCombos?.length || 0,
        functionTest: functionResult || 'Function not available'
      },
      message: 'Authentication and database access working correctly'
    });

  } catch (error) {
    console.error('=== AUTH TEST ERROR ===', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      step: 'exception'
    }, { status: 500 });
  }
} 