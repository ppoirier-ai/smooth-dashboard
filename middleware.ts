import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Logger from '@/lib/utils/logger';
import { withAuth } from "next-auth/middleware";

export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Log request
  Logger.info('API Request', {
    id: requestId,
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
  });

  try {
    const response = await NextResponse.next();
    
    // Log response
    Logger.info('API Response', {
      id: requestId,
      status: response.status,
      duration: Date.now() - startTime,
    });

    return response;
  } catch (error) {
    // Log error
    Logger.error('API Error', {
      id: requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });

    throw error;
  }
}

export default withAuth(
  function middleware(req) {
    // Add CORS headers if needed
    const res = NextResponse.next();
    res.headers.append("Access-Control-Allow-Origin", "*");
    return res;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     * - register
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
}; 