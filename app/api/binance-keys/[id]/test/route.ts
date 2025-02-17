import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getCombinedAccountInfo } from '@/lib/api/binance';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.publicKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the API key and its associated Binance account
    const apiKey = await prisma.ApiKey.findUnique({
      where: {
        id: params.id,
        userId: session.user.publicKey,
      },
      include: {
        binanceAccounts: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const binanceAccount = apiKey.binanceAccounts[0];
    if (!binanceAccount) {
      return NextResponse.json({ error: 'No Binance account found' }, { status: 404 });
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

    // Test the API key with Binance
    const accountInfo = await getCombinedAccountInfo(decryptedApiKey, decryptedSecret);

    return NextResponse.json({ success: true, data: accountInfo });
  } catch (error) {
    console.error('Error testing API key:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 