import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

// Use uppercase for consistency
const FOCUS_ASSETS = ['BTC', 'SOL', 'AAVE', 'USDT'];  // Make sure AAVE is included
const SYMBOL_MAPPING: { [key: string]: string } = {
  'AAVE': 'AAVE',  // Add any special mappings if needed
  'BTC': 'BTC',
  'SOL': 'SOL',
  'USDT': 'USDT'
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prices: { [key: string]: number } = {
      'USDT': 1 // Set USDT price to 1 by default
    };

    // Fetch prices for each asset against USDT
    const responses = await Promise.all(
      FOCUS_ASSETS.filter(asset => asset !== 'USDT').map(asset => {  // Skip USDT as we set it manually
        const symbol = `${SYMBOL_MAPPING[asset]}USDT`;
        console.log(`Fetching price for ${symbol}`);
        return fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
          // @ts-ignore
          agent,
          cache: 'no-store'
        });
      })
    );

    // Process responses
    await Promise.all(
      responses.map(async (response, index) => {
        if (response.ok) {
          const data = await response.json();
          const asset = FOCUS_ASSETS[index];
          prices[asset] = parseFloat(data.price);
          console.log(`Price for ${asset}: ${prices[asset]}`);
        } else {
          console.error(`Failed to fetch price for ${FOCUS_ASSETS[index]}`);
        }
      })
    );

    console.log('All fetched prices:', prices);
    console.log('Price response validation:', {
      hasAAVEPrice: !!prices.AAVE,
      aavePrice: prices.AAVE,
      allPrices: prices
    });
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
} 