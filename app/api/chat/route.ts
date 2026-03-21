import { NextResponse } from 'next/server';
import * as Ably from 'ably';

export const runtime = 'nodejs';

const apiKey = process.env.ABLY_API_KEY;

if (!apiKey) {
  throw new Error('ABLY_API_KEY environment variable is required');
}

const rest = new Ably.Rest({ key: apiKey });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawClientId = searchParams.get('clientId') ?? 'guest';
    const clientId = rawClientId.trim().slice(0, 64) || 'guest';

    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      capability: JSON.stringify({
        '*': ['publish', 'subscribe', 'presence', 'history'],
      }),
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Failed to create Ably token request', error);
    return NextResponse.json({ error: 'Failed to create token request' }, { status: 500 });
  }
}