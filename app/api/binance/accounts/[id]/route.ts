import { NextResponse } from 'next/server';
import { BinanceService } from '@/lib/services/binance.service';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const account = await BinanceService.updateAccount(params.id, data);
    return NextResponse.json(account);
  } catch (error) {
    console.error('Failed to update Binance account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await BinanceService.deleteAccount(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete Binance account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 