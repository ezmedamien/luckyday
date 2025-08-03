import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete user's saved combinations
    const { error: savedCombosError } = await supabase
      .from('saved_combos')
      .delete()
      .eq('user_id', userId);

    if (savedCombosError) {
      console.error('Error deleting saved combinations:', savedCombosError);
      return NextResponse.json(
        { error: '저장된 번호 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Delete any other user-related data (if you have other tables)
    // For example, if you have user preferences, profile data, etc.
    // const { error: userDataError } = await supabase
    //   .from('user_preferences')
    //   .delete()
    //   .eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user account data:', error);
    return NextResponse.json(
      { error: '계정 데이터 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 