import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getCombinedAccountInfo } from '@/lib/api/binance';

export async function GET(
  request: Request,
  { params }: { params: { viewToken: string } }
) {
  try {
    console.log('=== Starting public view request ===');
    console.log('1. Fetching account for viewToken:', params.viewToken);

    const binanceAccount = await prisma.binanceAccount.findUnique({
      where: {
        viewToken: params.viewToken,
      },
      include: {
        apiKey: true,
      },
    });

    if (!binanceAccount) {
      console.log('No account found for viewToken');
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Decrypt the API keys
    const decryptedApiKey = decrypt(
      binanceAccount.encryptedKey,
      binanceAccount.apiKeyIV,
      binanceAccount.apiKeyTag
    );

    const decryptedSecret = decrypt(
      binanceAccount.apiSecret,
      binanceAccount.secretKeyIV,
      binanceAccount.secretKeyTag
    );

    // Get account info from Binance
    const accountInfo = await getCombinedAccountInfo(decryptedApiKey, decryptedSecret);

    // Format the response with default values
    const formattedResponse = {
      spot: {
        balances: accountInfo.spot?.balances || [],
      },
      margin: {
        balances: accountInfo.margin?.balances || [],
        borrowings: accountInfo.margin?.borrowings || [],
        accountHealth: accountInfo.margin?.accountHealth || "0",
      },
      futures: {
        balances: accountInfo.futures?.balances || [],
        positions: accountInfo.futures?.positions || [],
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error in public view endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account data' },
      { status: 500 }
    );
  }
} 