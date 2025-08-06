import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Test if we can connect to the database
    const { data, error } = await supabase
      .from('weekly_favorites')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database test error:', error);
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tableExists: true
    });
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error
    }, { status: 500 });
  }
} 