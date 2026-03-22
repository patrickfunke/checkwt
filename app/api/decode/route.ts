import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {decodeToken} from "@/app/api/decode/util.ts";
import {decryptToken} from "@/app/api/decode/util_jwe.ts";
import { getKeyById, getPrivateKeyById } from '../keys/[keyId]/util';

const schema = z.object({
    token: z.string().min(1),
});

const SAFE_KEY_FIELDS = new Set(['kty', 'kid', 'alg', 'use', 'crv']);

function sanitizeKey(key: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!key) return null;
    const result: Record<string, unknown> = {};
    for (const field of Object.keys(key)) {
        result[field] = SAFE_KEY_FIELDS.has(field) ? key[field] : '...';
    }
    return result;
}

export async function POST(request: NextRequest) {

    let json;

    try {
        json = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
        );
    }

    const result = schema.safeParse(json);

    if (!result.success) {
        return NextResponse.json(
            { error: 'Missing or invalid token field' },
            { status: 400 }
        );
    }

    const { token } = result.data;
    const parts = token.split('.');


    if (parts.length === 5) {  // JWE
        const decrypted = await decryptToken(token);
        if ('error' in decrypted) {
            return NextResponse.json(
                { error: 'Failed to decrypt token' },
                { status: 400 }
            );
        }

        const outerHeader = {
            ...decrypted.header,
            kid: decrypted.header.kid ?? decrypted.keyKid,
        };
        const outerUsedKey = outerHeader.kid ? (await getPrivateKeyById(outerHeader.kid as string) || null) : null;

        // Check if the plaintext is itself a JWT (nested JWT-in-JWE per RFC 7519 §6)
        const innerParts = decrypted.plaintext.trim().split('.');
        if (innerParts.length === 3) {
            try {
                const inner = await decodeToken(decrypted.plaintext.trim());
                const innerUsedKey = inner.header.kid ? await getKeyById(inner.header.kid as string) : null;
                return NextResponse.json({
                    type: 'JWT-in-JWE',
                    outer: { header: outerHeader, usedKey: sanitizeKey(outerUsedKey) },
                    inner: {
                        header: inner.header,
                        payload: inner.payload,
                        signatureValid: inner.signatureCheck,
                        usedKey: sanitizeKey(innerUsedKey),
                    },
                }, { status: 200 });
            } catch {
                // plaintext looked like a JWT but couldn't be decoded — fall through to plain JWE
            }
        }

        return NextResponse.json(
            {
                header: outerHeader,
                type: 'JWE',
                payload: decrypted.plaintext,
                signatureValid: { verified: true },
                usedKey: sanitizeKey(outerUsedKey),
            },
            { status: 200 }
        );
    } else if (parts.length === 3) { // JWT
        let decoded;
        try {
            decoded = await decodeToken(token);
        } catch {
            return NextResponse.json(
                { error: 'Failed to decode token' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                header: decoded.header,
                type: 'JWT',
                payload: decoded.payload,
                signatureValid: decoded.signatureCheck,
                usedKey: sanitizeKey(decoded.header.kid ? await getKeyById(decoded.header.kid) : null)
            },
            { status: 200 }
        );
    } else {
        return NextResponse.json(
            { error: 'Invalid token format' },
            { status: 400 }
        );
    }


}