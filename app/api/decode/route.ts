import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {decodeToken} from "@/app/api/decode/util.ts";
import {decryptToken} from "@/app/api/decode/util_jwe.ts";

const schema = z.object({
    token: z.string().min(1),
});

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
        return NextResponse.json(
            {
                header: decrypted.header,
                payload: decrypted.plaintext,
                signatureValid: true, // TODO das macht iwie nicht so richtig Sinn bei JWEs
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
                payload: decoded.payload,
                signatureValid: decoded.signatureCheck.verified,
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