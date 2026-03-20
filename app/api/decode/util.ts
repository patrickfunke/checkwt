import fs from 'fs';
import path from 'path';
import { importJWK, jwtVerify, compactDecrypt, decodeProtectedHeader } from 'jose';

/* First step: JWT decode */
function parseToken(token: string) {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) {
        throw new Error("Invalid token format");
    }
    return { header, payload, signature };
}

function base64UrlDecode(input: string) {
    let str = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = str.length % 4;
    if (pad) {
        str += '='.repeat(4 - pad);
    }
    return Buffer.from(str, 'base64').toString('utf8');
}

export async function decodeToken(token: string) {
    const { header, payload, signature } = parseToken(token);
    const decodedHeader = decodeHeader(header);
    let decodedPayload: any = {};
    try {
        decodedPayload = JSON.parse(base64UrlDecode(payload));
    } catch (e) {
        decodedPayload = { raw: base64UrlDecode(payload) };
    }

    const signatureCheck = await checkSignature(token).catch((e) => ({ verified: false, reason: String(e) }));

    return { header: decodedHeader, payload: decodedPayload, signature, signatureCheck };
}

export function decodeHeader(headerB64: string) {
    try {
        return JSON.parse(base64UrlDecode(headerB64));
    } catch (e) {
        throw new Error('Invalid header encoding');
    }
}

/* Second step: JWT decode */

function checkSignature(token: string) {
    const { header } = parseToken(token);
    const decoded = decodeHeader(header);
    const jwksPath = path.resolve(process.cwd(), 'public', 'JWKS.json');
    if (!fs.existsSync(jwksPath)) {
        return Promise.resolve({ verified: false, reason: 'JWKS file not found' });
    }
    const jwks = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));
    const key = (jwks.keys || []).find((k: any) => k.kid === decoded.kid);
    if (!key) {
        return Promise.resolve({ verified: false, reason: 'No matching key in JWKS' });
    }
    return (async () => {
        const imported = await importJWK(key as any, key.alg || 'EdDSA');
        await jwtVerify(token, imported);
        return { verified: true };
    })();
}

/* Third step: decrypt JWE */
export async function decryptToken(token: string, options?: {
    jwksPath?: string;
    privateKey?: Record<string, unknown>;
}): Promise<{ plaintext: string; header: Record<string, unknown> } | { error: string }> {
    try {

        // Decode the protected header to find the matching key
        const protectedHeader = decodeProtectedHeader(token);

        // Resolve the decryption key
        const privateKey = await resolveDecryptionKey(protectedHeader, options);
        if (!privateKey) {
            return { error: 'No matching private key found for decryption' };
        }

        // Decrypt
        const { plaintext } = await compactDecrypt(token, privateKey);
        const decoded = new TextDecoder().decode(plaintext);

        return {
            plaintext: decoded,
            header: protectedHeader as Record<string, unknown>,
        };
    } catch (e) {
        return { error: String(e) };
    }
}

async function resolveDecryptionKey(
    header: Record<string, unknown>,
    options?: { jwksPath?: string; privateKey?: Record<string, unknown> }
) {
    // Option 1: Directly provided key
    if (options?.privateKey) {
        const alg = (header.alg as string) || 'RSA-OAEP-256';
        return await importJWK(options.privateKey, alg);
    }

    // Option 2: Load from JWKS file (private keys!)
    const jwksPath = options?.jwksPath
        ?? path.resolve(process.cwd(), 'private', 'JWKS.json');

    if (!fs.existsSync(jwksPath)) {
        return null;
    }

    const jwks = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));
    const keys: any[] = jwks.keys || [];

    // Match by kid, or fall back to first key with correct use
    const key = keys.find((k) =>
        (header.kid ? k.kid === header.kid : true) &&
        (k.use === 'enc' || !k.use)
    );

    if (!key) return null;

    const alg = (header.alg as string) || key.alg || 'RSA-OAEP-256';
    return await importJWK(key, alg);
}

/* Fourth step: Educate Users */
function educateUsers() {
    return {
        note: 'This helper decodes JWT header and payload. Use checkSignature to verify against your JWKS.'
    };
}