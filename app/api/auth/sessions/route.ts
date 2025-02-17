import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userAgent = request.headers.get('user-agent') || '';
  const parser = new UAParser(userAgent);
  const currentSessionId = (session as any).sessionToken;

  const activeSessions = await prisma.session.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      expires: 'desc',
    },
  });

  return NextResponse.json(
    activeSessions.map(s => ({
      id: s.id,
      lastActive: s.expires,
      device: parser.getDevice().type || 'Desktop',
      browser: parser.getBrowser().name || 'Unknown',
      isCurrent: s.sessionToken === currentSessionId,
    }))
  );
} 