import { NextResponse } from 'next/server';
import { PortfolioService } from '@/lib/services/portfolio.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const history = await PortfolioService.getHistoricalData(days);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
} 