import {compactDecrypt, decodeProtectedHeader, importJWK} from "jose";
import path from "path";
import fs from "fs";

function parseJwe(token: string) {
    const [header, encryptedKey, iv, ciphertext, tag] = token.split(".");
    if (!header || !encryptedKey || !iv || !ciphertext || !tag) {
        throw new Error("Invalid token format");
    }
    return { header, encryptedKey, iv, ciphertext, tag };
}

export async function decryptToken(token: string) {
    try {
        const protectedHeader = decodeProtectedHeader(token);

        console.log(protectedHeader);

        const privateKey = await resolveDecryptionKey(protectedHeader);
        if (!privateKey) {
            return { error: 'No matching private key found' };
        }

        const { plaintext } = await compactDecrypt(token, privateKey);

        return {
            plaintext: new TextDecoder().decode(plaintext),
            header: protectedHeader,
        };
    } catch (e) {
        return { error: String(e) };
    }
}

async function resolveDecryptionKey(header: Record<string, unknown>) {
    const jwksPath = path.resolve(process.cwd(), 'private', 'JWKS.json');

    if (!fs.existsSync(jwksPath)) {
        throw new Error("JWKS not found");
    }

    const jwks = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));
    const keys = jwks.keys || [];

    const key = keys.find((k: any) =>
        (header.kid ? k.kid === header.kid : true)
    );

    if (!key) return null;

    const alg = (header.alg as string) || key.alg || 'RSA-OAEP-256';

    return await importJWK(key, alg);
}