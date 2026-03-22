import { parseInput, validateHeader, validatePayload, generateSignKey, generateJWT } from './util';
import { generateEncKey, generateJWE } from './util_jwe';
import { saveKey } from '@/lib/jwks-store';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { header, payload } = parseInput(body);
        const validHeader = validateHeader(header);
        const validPayload = validatePayload(payload);
        const mode = (body.mode || 'jwt').toString().toLowerCase();

        if (mode === 'jwe') {
            // if caller provided a recipient public key, use it; otherwise generate one and persist
            const recipient = (body.recipientKey) ? body.recipientKey : null;

            let recipientKey = recipient;
            let publicJwk: any = null;
            let privateJwk: any = null;

            if (!recipientKey) {
                const { privateKey, publicJwk: pub, privateJwk: priv } = await generateEncKey(validHeader.alg || 'RSA-OAEP-256');
                publicJwk = pub;
                privateJwk = priv;
                recipientKey = publicJwk;

                if (publicJwk) {
                    await saveKey(publicJwk, 'public');
                }

                if (privateJwk) {
                    await saveKey(privateJwk, 'private');
                }
            }

            const hdr = { ...validHeader, ...(publicJwk?.kid ? { kid: publicJwk.kid } : {}) };
            const token = await generateJWE(hdr, validPayload, recipientKey);

            return new Response(JSON.stringify({ token }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // default: jwt
        const { privateKey, publicJwk } = await generateSignKey(validHeader.alg || 'EdDSA');
        await saveKey(publicJwk, 'public');
        const hdr = { ...validHeader, alg: publicJwk.alg, kid: publicJwk.kid };
        const token = await generateJWT(hdr, validPayload, privateKey);

        return new Response(JSON.stringify({ token }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
}

export { };
