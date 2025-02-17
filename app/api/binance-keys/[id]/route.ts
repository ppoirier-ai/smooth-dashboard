import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.publicKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, delete associated BinanceAccount
    await prisma.binanceAccount.deleteMany({
      where: {
        apiKeyId: params.id,
        userId: session.user.publicKey,
      },
    });

    // Then delete the API key
    await prisma.apiKey.delete({
      where: {
        id: params.id,
        userId: session.user.publicKey,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 