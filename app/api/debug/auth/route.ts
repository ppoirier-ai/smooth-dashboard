import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const dbUser = session?.user?.id 
      ? await prisma.user.findUnique({
          where: { id: session.user.id }
        })
      : null;

    return NextResponse.json({
      session,
      dbUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Debug endpoint error' }, { status: 500 });
  }
} 