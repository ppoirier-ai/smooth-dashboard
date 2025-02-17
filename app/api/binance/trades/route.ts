import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import https from 'https';
import crypto from 'crypto';

const agent = new https.Agent({
  rejectUnauthorized: false
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const binanceAccount = await prisma.binanceAccount.findFirst({
      where: { userId: session.user.id },
    });

    if (!binanceAccount) {
      return NextResponse.json({ error: 'No Binance account found' }, { status: 404 });
    }

    const apiKey = decrypt(binanceAccount.apiKey, binanceAccount.apiKeyIV, binanceAccount.apiKeyTag);
    const apiSecret = decrypt(binanceAccount.apiSecret, binanceAccount.secretKeyIV, binanceAccount.secretKeyTag);

    // Get server time
    const timeResponse = await fetch('https://api.binance.com/api/v3/time', {
      // @ts-ignore
      agent,
      cache: 'no-store',
    });
    const timeData = await timeResponse.json();
    const timestamp = timeData.serverTime;

    // Get trades for common pairs
    const pairs = ['BTCUSDT', 'SOLUSDT', 'AAVEUSDT'];
    const avgPrices: { [key: string]: number } = {};

    for (const pair of pairs) {
      const queryString = `symbol=${pair}&timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      const response = await fetch(
        `https://api.binance.com/api/v3/myTrades?${queryString}&signature=${signature}`,
        {
          headers: { 'X-MBX-APIKEY': apiKey },
          // @ts-ignore
          agent,
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const trades = await response.json();
        if (trades.length > 0) {
          // Calculate weighted average price
          let totalQuantity = 0;
          let totalCost = 0;
          trades.forEach((trade: any) => {
            const quantity = parseFloat(trade.qty);
            const price = parseFloat(trade.price);
            totalQuantity += quantity;
            totalCost += quantity * price;
          });
          const asset = pair.replace('USDT', '');
          avgPrices[asset] = totalCost / totalQuantity;
        }
      }
    }

    return NextResponse.json(avgPrices);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
} 