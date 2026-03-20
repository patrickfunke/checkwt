import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {

    let body;

    try {
        body = await request.json();
    } catch {
        return new NextResponse(null, { status: 400 });
    }

    if (!body?.token) {
        return new NextResponse(null, { status: 400 });
    }

    const token = body.token;

    return NextResponse.json(
        {
            header: {
                test: "yes",
                token: token
            },
            payload: {
                test: "yes"
            },
            signatureValid: true,
        },
        { status: 200 }
    );
}