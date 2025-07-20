import { NextResponse } from 'next/server';
import { getAllLottoHistoryFromCSV } from '@/lib/fetchLotto';

export async function GET() {
  const draws = getAllLottoHistoryFromCSV();
  return NextResponse.json({ draws });
}