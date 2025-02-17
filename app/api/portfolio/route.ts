import { NextResponse } from 'next/server';
import { PortfolioService } from '@/lib/services/portfolio.service';

export async function GET() {
  try {
    const latestSnapshot = await PortfolioService.getLatestSnapshot();
    return NextResponse.json(latestSnapshot);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const snapshot = await PortfolioService.createSnapshot(body);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }
} 