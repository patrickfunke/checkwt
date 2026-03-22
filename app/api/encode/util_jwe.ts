import { generateKeyPair, generateSecret, exportJWK, EncryptJWT, CompactEncrypt, importJWK } from 'jose';
import { randomUUID } from 'crypto';

export function parseInput(input: any) {
	if (!input || typeof input !== 'object') throw new Error('Invalid input');
	const { header, payload, recipientKey } = input;
	return { header, payload, recipientKey };
}

export function validateHeader(header: any) {
	if (!header || typeof header !== 'object') throw new Error('Header must be an object');
	return header;
}

export function validatePayload(payload: any) {
	if (!payload || typeof payload !== 'object') throw new Error('Payload must be an object');
	return payload;
}

const SYMMETRIC_KEY_WRAP_ALGS = ['A128KW', 'A192KW', 'A256KW', 'A128GCMKW', 'A192GCMKW', 'A256GCMKW'];

export async function generateEncKey(alg = 'RSA-OAEP-256') {
	const kid = randomUUID();
	if (SYMMETRIC_KEY_WRAP_ALGS.includes(alg)) {
		const secretKey = await generateSecret(alg as any, { extractable: true });
		const jwk: any = await exportJWK(secretKey);
		jwk.kid = kid;
		jwk.alg = alg;
		jwk.use = 'enc';
		// Symmetric: same key is used for both wrap and unwrap
		return { privateKey: secretKey, publicJwk: jwk, privateJwk: jwk };
	}
	const { publicKey, privateKey } = await generateKeyPair(alg as any, { extractable: true });
	const publicJwk: any = await exportJWK(publicKey);
	const privateJwk: any = await exportJWK(privateKey);
	publicJwk.kid = kid;
	privateJwk.kid = kid;
	publicJwk.alg = alg;
	privateJwk.alg = alg;
	publicJwk.use = 'enc';
	privateJwk.use = 'enc';
	return { privateKey, publicJwk, privateJwk };
}

export async function generateJWE(header: any = {}, payload: any, recipientKey: any) {
	const payloadObj = { ...(payload || {}) };
	const protectedHeader = { ...(header || {}) };
	if (!protectedHeader.typ) protectedHeader.typ = 'JWT';
	const encryptor = new EncryptJWT(payloadObj);
	encryptor.setProtectedHeader(protectedHeader);

// Ensure we never include an `iat` (issued-at) claim in either header or payload.
if (Object.prototype.hasOwnProperty.call(protectedHeader, 'iat')) delete protectedHeader.iat;
if (Object.prototype.hasOwnProperty.call(payloadObj, 'iat')) delete payloadObj.iat;

// Do not set `iat` automatically; caller must include it if desired.

	// recipientKey may be a JWK, CryptoKey or KeyObject. If not provided, caller should supply.
	if (!recipientKey) throw new Error('No recipient key provided for JWE encryption');

	const token = await encryptor.encrypt(recipientKey as any);
	return token;
}

export async function generateNestedJWE(
	jwtString: string,
	header: { alg: string; enc: string; kid?: string; [k: string]: unknown },
	recipientJwk: any,
): Promise<string> {
	const plaintext = new TextEncoder().encode(jwtString);
	const recipientKey = await importJWK(recipientJwk, recipientJwk.alg || header.alg);
	return new CompactEncrypt(plaintext)
		.setProtectedHeader({ ...header, cty: 'JWT' })
		.encrypt(recipientKey as any);
}

export { };

