import fs from 'fs';
import path from 'path';
import { parseInput, validateHeader, validatePayload, generateSignKey, generateJWT } from './util';
import { getKeyById } from '../keys/[keyId]/util';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { header, payload } = parseInput(body);
        const validHeader = validateHeader(header);
        const validPayload = validatePayload(payload);

        const alg = (validHeader && validHeader.alg) || 'EdDSA';
        const { privateKey, publicJwk } = await generateSignKey(alg);

        const jwksPath = path.join(process.cwd(), 'public', 'JWKS.json');
        let jwks: any = { keys: [] };
        try {
            const existing = await fs.promises.readFile(jwksPath, 'utf-8');
            jwks = JSON.parse(existing);
            if (!Array.isArray(jwks.keys)) jwks.keys = [];
        } catch (e) {
            // file might not exist; we'll create it
            jwks = { keys: [] };
        }

        jwks.keys.push(publicJwk);
        await fs.promises.writeFile(jwksPath, JSON.stringify(jwks, null, 2), 'utf-8');

        const hdr = { ...validHeader, alg, kid: publicJwk.kid };
        const token = await generateJWT(hdr, validPayload, privateKey);

        const fetchedKey = getKeyById(publicJwk.kid);
        return new Response(JSON.stringify({ token, jwk: publicJwk, fetchedKey }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
}

export { };
