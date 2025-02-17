import { NextResponse } from 'next/server';
import { BinanceService } from '@/lib/services/binance.service';

export async function GET(request: Request) {
  // TODO: Get userId from session
  const userId = 'test-user-id';
  
  try {
    const accounts = await BinanceService.listAccounts(userId);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to list Binance accounts:', error);
    return NextResponse.json(
      { error: 'Failed to list accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // TODO: Get userId from session
  const userId = 'test-user-id';
  
  try {
    const data = await request.json();
    const account = await BinanceService.addAccount({
      userId,
      ...data,
    });
    return NextResponse.json(account);
  } catch (error) {
    console.error('Failed to add Binance account:', error);
    return NextResponse.json(
      { error: 'Failed to add account' },
      { status: 500 }
    );
  }
} 