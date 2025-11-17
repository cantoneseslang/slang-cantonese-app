import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API endpoint is working!',
    timestamp: new Date().toISOString(),
    path: '/api/test',
  });
}

