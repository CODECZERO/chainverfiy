import { NextRequest, NextResponse } from 'next/server';

/**
 * Standard Next.js API Route Proxy for Stellar Horizon.
 * This pattern is more "standard" on Vercel and avoids triggering strict 
 * Firewall/WAF rules associated with direct edge rewrites to external sensitive APIs.
 */
async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `https://horizon-testnet.stellar.org/${path}${searchParams ? '?' + searchParams : ''}`;

  try {
    const body = request.method !== 'GET' && request.method !== 'HEAD' 
      ? await request.text() 
      : undefined;

    const res = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { 'Content-Type': contentType || 'text/plain' } });
    }
  } catch (error) {
    console.error(`[HORIZON PROXY ERROR] ${request.method} ${targetUrl}:`, error);
    return NextResponse.json({ error: 'Horizon Proxy Error' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
export const PUT = handle;
