import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getCombinedAccountInfo } from '@/lib/api/binance';
import { 
  getSpotAccount, 
  getMarginAccount, 
  getFuturesAccount,
  getTradingBotAccounts
} from '@/lib/api/binance';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', {
      exists: !!session,
      user: session?.user,
      publicKey: session?.user?.publicKey
    });

    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    if (!session?.user?.publicKey) {
      console.log('No session or publicKey found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');
    console.log('Searching for API key:', { keyId });

    try {
      // First get the API key
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          userId: session.user.publicKey,
          ...(keyId ? { id: keyId } : { isActive: true }),
        },
      });
      console.log('API key found:', { exists: !!apiKey, id: apiKey?.id });

      if (!apiKey) {
        return NextResponse.json({ error: 'No API key found' }, { status: 404 });
      }

      // Then get the Binance account
      const binanceAccount = await prisma.binanceAccount.findFirst({
        where: { 
          userId: session.user.publicKey,
          apiKeyId: apiKey.id
        },
      });
      console.log('Binance account found:', { 
        exists: !!binanceAccount, 
        id: binanceAccount?.id,
        userId: binanceAccount?.userId,
        apiKeyId: binanceAccount?.apiKeyId 
      });

      if (!binanceAccount) {
        return NextResponse.json({ 
          error: 'No Binance account found',
          details: {
            userId: session.user.publicKey,
            apiKeyId: apiKey.id
          }
        }, { status: 404 });
      }

      try {
        // Decrypt credentials
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

        console.log('Credentials decrypted successfully');

        const accountInfo = await getCombinedAccountInfo(decryptedApiKey, decryptedSecret);
        console.log('Account info retrieved successfully');

        // Format the response with default values
        const formattedData = {
          spot: {
            balances: accountInfo.spot?.balances || [],
            canTrade: accountInfo.spot?.canTrade || false
          },
          margin: {
            balances: accountInfo.margin?.balances || [],
            totalAssetOfBtc: parseFloat(accountInfo.margin?.totalAssetOfBtc || "0"),
            totalLiabilityOfBtc: parseFloat(accountInfo.margin?.totalLiabilityOfBtc || "0"),
            totalNetAssetOfBtc: parseFloat(accountInfo.margin?.totalNetAssetOfBtc || "0"),
            marginRatio: parseFloat(accountInfo.margin?.marginRatio || "0"),
            marginLevel: parseFloat(accountInfo.margin?.level || "0"),
            totalCollateralValueInUSDT: 0
          },
          futures: {
            balances: accountInfo.futures?.balances || [],
            totalWalletBalance: parseFloat(accountInfo.futures?.totalWalletBalance || "0"),
            totalUnrealizedProfit: parseFloat(accountInfo.futures?.totalUnrealizedProfit || "0"),
            totalMarginBalance: parseFloat(accountInfo.futures?.totalMarginBalance || "0")
          },
          tradingBot: {
            balances: []
          },
          updateTime: Date.now()
        };

        return NextResponse.json(formattedData);
      } catch (error) {
        console.error('Inner error:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
          { 
            error: 'Failed to fetch account info', 
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error', 
        details: dbError instanceof Error ? dbError.message : 'Unknown error' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Outer error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 