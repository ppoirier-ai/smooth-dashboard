import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.publicKey) {
      console.log('No session or publicKey found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching keys for user:', session.user.publicKey);

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.publicKey,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found keys:', apiKeys.length);

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch API keys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.publicKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Deactivate other keys if this is the first one
    const existingKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.publicKey },
    });

    const newKey = await prisma.apiKey.create({
      data: {
        name,
        userId: session.user.publicKey,
        isActive: existingKeys.length === 0, // First key is active by default
      },
    });

    return NextResponse.json(newKey);
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.publicKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // If setting a key to active, deactivate all other keys
    if (isActive) {
      await prisma.apiKey.updateMany({
        where: {
          userId: session.user.publicKey,
          NOT: { id },
        },
        data: { isActive: false },
      });
    }

    const updatedKey = await prisma.apiKey.update({
      where: {
        id,
        userId: session.user.publicKey,
      },
      data: { isActive },
    });

    return NextResponse.json(updatedKey);
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update API key',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 