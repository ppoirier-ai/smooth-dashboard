import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { APIError, ErrorCodes, ErrorMessages } from '@/lib/utils/errors';
import crypto from 'crypto';
import { Prisma, BinanceAccount } from '@prisma/client';

interface ApiKeyWithBinanceAccounts {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  binanceAccounts: {
    id: string;
    encryptedKey: string;
    apiKeyIV: string;
    apiKeyTag: string;
    apiSecret: string;
    secretKeyIV: string;
    secretKeyTag: string;
    viewToken: string;
  }[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.publicKey) {
      console.log('No session or publicKey found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching binance keys for user:', session.user.publicKey);

    // Get all API keys with their associated Binance accounts
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.publicKey,
      },
      include: {
        binanceAccounts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add debug logging
    console.log('Raw API keys:', JSON.stringify(apiKeys, null, 2));

    // Format the response to match the UI expectations
    const formattedKeys = apiKeys.map((key) => {
      const binanceAccount = key.binanceAccounts[0];
      console.log(`Processing key ${key.id}, binanceAccount:`, binanceAccount);
      
      return {
        id: key.id,
        label: key.name,
        createdAt: key.createdAt.toISOString(),
        status: key.isActive ? 'valid' : 'invalid',
        viewToken: binanceAccount?.viewToken || '',
      };
    });

    console.log('Formatted keys:', JSON.stringify(formattedKeys, null, 2));

    return NextResponse.json(formattedKeys);
  } catch (error) {
    console.error('Error fetching Binance API keys:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Binance API keys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Step 1: Validate session
    const session = await getServerSession(authOptions);
    console.log('Session:', {
      exists: !!session,
      user: session?.user,
      publicKey: session?.user?.publicKey
    });
    
    if (!session?.user?.publicKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse and validate request body
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: 'Could not parse JSON'
      }, { status: 400 });
    }

    console.log('Parsed body:', body);

    // Step 3: Validate required fields
    const name = body.label;
    const binanceKey = body.apiKey;
    const binanceSecret = body.secretKey;

    console.log('Extracted values:', {
      name,
      binanceKeyLength: binanceKey?.length,
      binanceSecretLength: binanceSecret?.length
    });

    if (!name || !binanceKey || !binanceSecret) {
      return NextResponse.json({ 
        error: 'Name, Binance API key, and secret are required',
        details: {
          name: !name ? 'missing' : 'provided',
          binanceKey: !binanceKey ? 'missing' : 'provided',
          binanceSecret: !binanceSecret ? 'missing' : 'provided',
        },
        receivedBody: body
      }, { status: 400 });
    }

    // Step 4: Create or get user
    console.log('Creating/getting user with ID:', session.user.publicKey);
    let user;
    try {
      user = await prisma.user.upsert({
        where: { id: session.user.publicKey },
        update: {},
        create: {
          id: session.user.publicKey,
          name: session.user.name || 'Anonymous',
          email: session.user.email || `${session.user.publicKey}@placeholder.com`, // Add placeholder email
        },
      });
      console.log('User created/updated:', user);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return NextResponse.json({
        error: 'Failed to create/update user',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 5: Create API key
    console.log('Creating API key for user:', user.id);
    let newKey;
    try {
      newKey = await prisma.apiKey.create({
        data: {
          name,
          userId: user.id,
          isActive: true,
        },
      });
      console.log('API key created:', newKey);
    } catch (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json({
        error: 'Failed to create API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 6: Encrypt sensitive data
    console.log('Encrypting API key and secret');
    let encryptedData;
    try {
      encryptedData = {
        apiKey: encrypt(binanceKey),
        secret: encrypt(binanceSecret)
      };
      console.log('Encryption successful');
    } catch (error) {
      console.error('Error encrypting data:', error);
      return NextResponse.json({
        error: 'Failed to encrypt data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 7: Create Binance account
    console.log('Creating Binance account');
    let binanceAccount: BinanceAccount;
    try {
      const viewToken = crypto.randomBytes(32).toString('hex');
      console.log('Generated viewToken:', viewToken);

      binanceAccount = await prisma.binanceAccount.create({
        data: {
          userId: user.id,
          apiKey: {
            connect: {
              id: newKey.id
            }
          },
          encryptedKey: encryptedData.apiKey.encryptedData,
          apiKeyIV: encryptedData.apiKey.iv,
          apiKeyTag: encryptedData.apiKey.tag,
          apiSecret: encryptedData.secret.encryptedData,
          secretKeyIV: encryptedData.secret.iv,
          secretKeyTag: encryptedData.secret.tag,
          viewToken,
        },
      });
      console.log('Binance account created:', {
        id: binanceAccount.id,
        viewToken: binanceAccount.viewToken
      });
    } catch (error) {
      console.error('Error creating Binance account:', error);
      
      // Clean up the created API key if BinanceAccount creation fails
      await prisma.apiKey.delete({
        where: { id: newKey.id }
      });
      
      return NextResponse.json({
        error: 'Failed to create Binance account',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    const response = {
      id: newKey.id,
      label: newKey.name,
      createdAt: newKey.createdAt.toISOString(),
      status: 'valid',
      viewToken: binanceAccount.viewToken,
    };

    console.log('Sending response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 