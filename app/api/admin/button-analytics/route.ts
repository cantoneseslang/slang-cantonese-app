import { NextRequest, NextResponse } from 'next/server';
import { getButtonCounts } from '@/lib/analytics/buttonCounts';

export async function GET(request: NextRequest) {
  try {
    const counts = getButtonCounts();
    
    return NextResponse.json({
      totalButtons: counts.total,
      categoryButtons: counts.byCategory
    });
  } catch (error) {
    console.error('Error fetching button analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

