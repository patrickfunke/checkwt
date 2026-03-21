import fs from 'fs';
import path from 'path';
import { parseInput, validateHeader, validatePayload, generateSignKey, generateJWT } from './util';
import { generateEncKey, generateJWE } from './util_jwe';

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

                // write public JWKS into public/JWKS.json (if we generated an asymmetric public key)
                if (publicJwk) {
                    const pubPath = path.join(process.cwd(), 'private', 'JWKS.json');
                    let pubks: any = { keys: [] };
                    try {
                        const existing = await fs.promises.readFile(pubPath, 'utf-8');
                        pubks = JSON.parse(existing);
                        if (!Array.isArray(pubks.keys)) pubks.keys = [];
                    } catch (e) {
                        pubks = { keys: [] };
                    }
                    pubks.keys.push(publicJwk);
                    await fs.promises.mkdir(path.dirname(pubPath), { recursive: true });
                    await fs.promises.writeFile(pubPath, JSON.stringify(pubks, null, 2), 'utf-8');
                }

                // write private JWKS for decryption into private/JWKS.json (symmetric or private parts)
                if (privateJwk) {
                    const privPath = path.join(process.cwd(), 'private', 'JWKS.json');
                    let privs: any = { keys: [] };
                    try {
                        const existing = await fs.promises.readFile(privPath, 'utf-8');
                        privs = JSON.parse(existing);
                        if (!Array.isArray(privs.keys)) privs.keys = [];
                    } catch (e) {
                        privs = { keys: [] };
                    }
                    privs.keys.push(privateJwk);
                    // ensure private dir exists
                    await fs.promises.mkdir(path.dirname(privPath), { recursive: true });
                    await fs.promises.writeFile(privPath, JSON.stringify(privs, null, 2), 'utf-8');
                }
            }

            const hdr = { ...validHeader };
            const token = await generateJWE(hdr, validPayload, recipientKey);

            return new Response(JSON.stringify({ token }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // default: jwt
        const { privateKey, publicJwk } = await generateSignKey(validHeader.alg || 'EdDSA');

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
        const hdr = { ...validHeader, alg: publicJwk.alg, kid: publicJwk.kid };
        const token = await generateJWT(hdr, validPayload, privateKey);

        return new Response(JSON.stringify({ token }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
}

export { };
