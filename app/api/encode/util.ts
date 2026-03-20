

import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { randomUUID } from 'crypto';

export function parseInput(input: any) {
    if (!input || typeof input !== 'object') throw new Error('Invalid input');
    const { header, payload, signingKey, encryptionKey } = input;
    return { header, payload, signingKey, encryptionKey };
}

export function validateHeader(header: any) {
    if (!header || typeof header !== 'object') throw new Error('Header must be an object');
    return header;
}

export function validatePayload(payload: any) {
    if (!payload || typeof payload !== 'object') throw new Error('Payload must be an object');
    return payload;
}

export async function generateSignKey(alg = 'EdDSA') {
    const { publicKey, privateKey } = await generateKeyPair(alg);
    const publicJwk: any = await exportJWK(publicKey);
    const kid = randomUUID();
    publicJwk.kid = kid;
    publicJwk.alg = alg;
    publicJwk.use = 'sig';
    return { privateKey, publicJwk };
}

export async function generateJWT(header: any = {}, payload: any, privateKey: any) {
    const signer = new SignJWT({ ...payload });
    const protectedHeader = { ...(header || {}) };
    if (!protectedHeader.typ) protectedHeader.typ = 'JWT';
    signer.setProtectedHeader(protectedHeader);
    const token = await signer.sign(privateKey);
    return token;
}
