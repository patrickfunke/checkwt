import { compactDecrypt, decodeProtectedHeader, importJWK } from "jose";
import path from "path";
import fs from "fs";
import { getPrivateKeyById } from '../keys/[keyId]/util';

type JweHeader = {
    alg?: string;
    enc?: string;
    kid?: string;
};

type JwkLike = {
    kty?: string;
    kid?: string;
    alg?: string;
    use?: string;
    d?: string;
    k?: string;
    [key: string]: unknown;
};

export async function decryptToken(token: string) {
    try {
        const protectedHeader = decodeProtectedHeader(token) as JweHeader;
        const candidateKeys = await resolveDecryptionKeys(protectedHeader);
        if (candidateKeys.length === 0) {
            return { error: 'No matching private key found' };
        }

        for (const key of candidateKeys) {
            try {
                const importAlg = protectedHeader.alg || key.alg;
                const decryptionKey = await importJWK(key as any, importAlg as any);
                const { plaintext } = await compactDecrypt(token, decryptionKey);

                return {
                    plaintext: new TextDecoder().decode(plaintext),
                    header: protectedHeader,
                    keyKid: key.kid,
                };
            } catch {
                // try next key candidate
            }
        }

        return { error: 'No decryption key could decrypt this token' };
    } catch (e) {
        return { error: String(e) };
    }
}

function keyMatchesHeader(key: JwkLike, header: JweHeader) {
    if (key.use && key.use !== 'enc') return false;
    if (header.kid && key.kid !== header.kid) return false;
    if (header.alg && key.alg && key.alg !== header.alg) return false;

    if (key.kty === 'RSA') {
        return Boolean(key.d);
    }

    if (key.kty === 'EC' || key.kty === 'OKP') {
        return Boolean(key.d);
    }

    if (key.kty === 'oct') {
        return Boolean(key.k);
    }

    return false;
}

async function resolveDecryptionKeys(header: JweHeader) {
    // If header contains a kid, try to resolve that single private key via helper first.
    if (header.kid) {
        const single = getPrivateKeyById(header.kid);
        if (single && keyMatchesHeader(single as JwkLike, header)) {
            return [single as JwkLike];
        }
        // if a specific kid was requested but not found/matching, fall through to scan entire private JWKS
    }

    const jwksPath = path.resolve(process.cwd(), 'private', 'JWKS.json');

    if (!fs.existsSync(jwksPath)) {
        throw new Error("JWKS not found");
    }

    const jwks = JSON.parse(fs.readFileSync(jwksPath, 'utf8')) as { keys?: JwkLike[] };
    const keys = Array.isArray(jwks.keys) ? jwks.keys : [];

    const matching = keys.filter((k) => keyMatchesHeader(k, header));

    // Prefer exact kid/alg matches first, then other compatible keys.
    matching.sort((a, b) => {
        const aScore = (header.kid && a.kid === header.kid ? 2 : 0) + (header.alg && a.alg === header.alg ? 1 : 0);
        const bScore = (header.kid && b.kid === header.kid ? 2 : 0) + (header.alg && b.alg === header.alg ? 1 : 0);
        return bScore - aScore;
    });

    return matching;
}