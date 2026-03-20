import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {decodeToken} from "@/app/api/decode/util.ts";

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

    let decoded;

    try {
        decoded = await decodeToken(token);
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