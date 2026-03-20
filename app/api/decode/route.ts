import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {decodeToken, decryptToken} from "@/app/api/decode/util.ts";

const schema = z.object({
    token: z.string().min(1),
});

export async function POST(request: NextRequest) {

    let json;

    try {
        json = await request.json();
    } catch {
        return new NextResponse(null, { status: 400 });
    }

    const result = schema.safeParse(json);

    if (!result.success) {
        return new NextResponse(null, { status: 400 });
    }

    const { token } = result.data;
    const parts = token.split('.');

    let jwtToken: string;

    if (parts.length === 5) {
        const decrypted = await decryptToken(token);
        if ('error' in decrypted) {
            return new NextResponse(null, { status: 400 });
        }
        jwtToken = decrypted.plaintext;
    } else if (parts.length === 3) {
        jwtToken = token;
    } else {
        return new NextResponse(null, { status: 400 });
    }

    let decoded;
    try {
        decoded = await decodeToken(jwtToken);
    } catch {
        return new NextResponse(null, { status: 400 });
    }

    return NextResponse.json(
        {
            header: decoded.header,
            payload: decoded.payload,
            signatureValid: decoded.signatureCheck.verified,
        },
        { status: 200 }
    );
}