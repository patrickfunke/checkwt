import { validateHeader, validatePayload, generateSignKey, generateJWT } from './util';
import { generateEncKey, generateNestedJWE } from './util_jwe';
import { saveKey } from '@/lib/jwks-store';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const mode = (body.mode || 'jwt').toString().toLowerCase();

        if (mode === 'jwt-in-jwe') {
            const innerHeader = validateHeader(body.innerHeader || {});
            const outerHeader = validateHeader(body.outerHeader || {});
            const validPayload = validatePayload(body.payload);

            // Step 1: sign the inner JWT
            const { privateKey: signPrivKey, publicJwk: signPubJwk } = await generateSignKey(innerHeader.alg || 'EdDSA');
            await saveKey(signPubJwk, 'public');
            const innerJwtHeader = { ...innerHeader, alg: signPubJwk.alg, kid: signPubJwk.kid };
            const innerJwt = await generateJWT(innerJwtHeader, validPayload, signPrivKey);

            // Step 2: encrypt the inner JWT as the JWE plaintext
            const { publicJwk: encPubJwk, privateJwk: encPrivJwk } = await generateEncKey(outerHeader.alg || 'RSA-OAEP-256');
            await saveKey(encPubJwk, 'public');
            await saveKey(encPrivJwk, 'private');
            const outerJweHeader = { ...outerHeader, kid: encPubJwk.kid };
            const token = await generateNestedJWE(innerJwt, outerJweHeader, encPubJwk);

            return new Response(JSON.stringify({ token, innerJwt }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // default: plain JWT
        const validHeader = validateHeader(body.header || {});
        const validPayload = validatePayload(body.payload);
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
