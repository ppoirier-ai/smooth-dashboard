import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { BinanceApiService, BinanceApiError } from '@/lib/services/binance-api.service';
import Logger from '@/lib/utils/logger';

export async function POST(request: Request) {
  const headersList = headers();
  const clientIp = headersList.get('x-forwarded-for') || 'unknown';
  
  try {
    const { apiKey, apiSecret } = await request.json();
    Logger.info('Received API test connection request', { clientIp });

    if (!apiKey || !apiSecret) {
      Logger.warn('Missing API credentials', { clientIp });
      return NextResponse.json(
        { error: 'API key and secret are required' },
        { status: 400 }
      );
    }

    await BinanceApiService.testConnection(apiKey, apiSecret, clientIp);
    Logger.info('API test connection successful', { clientIp });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BinanceApiError) {
      Logger.warn('API test connection failed with known error', {
        clientIp,
        errorCode: error.code,
        errorMessage: error.message,
      });
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status || 400 }
      );
    }

    Logger.error('API test connection failed with unknown error', {
      clientIp,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 