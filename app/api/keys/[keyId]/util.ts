import fs from 'fs';
import path from 'path';

interface JWK {
    kty: string;
    kid: string;
    alg: string;
    crv?: string;
    x?: string;
    y?: string;
    [key: string]: unknown;
}

interface JWKS {
    keys: JWK[];
}

/**
 * Gibt den JWK-Schlüssel mit der angegebenen `kid` zurück.
 * @param kid Die Key ID des gesuchten Schlüssels.
 * @returns Den gefundenen Schlüssel oder `null`, falls nicht gefunden.
 */
export function getKeyById(kid: string): JWK | null {
    try {
        const jwksPath = path.resolve(process.cwd(), 'public', 'JWKS.json');

        if (!fs.existsSync(jwksPath)) {
            console.error('JWKS-Datei nicht gefunden.');
            return null;
        }

        const jwks: JWKS = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));

        const key = jwks.keys.find((k) => k.kid === kid);

        return key || null;
    } catch (error) {
        console.error('Fehler beim Lesen der JWKS-Datei:', error);
        return null;
    }
}

/**
 * Wie `getKeyById`, aber liest aus dem privaten JWKS (private/JWKS.json).
 * Wird für JWE/Entschlüsselung verwendet, da dort private Schlüssel nötig sind.
 */
export function getPrivateKeyById(kid: string): JWK | null {
    try {
        const jwksPath = path.resolve(process.cwd(), 'private', 'JWKS.json');

        if (!fs.existsSync(jwksPath)) {
            console.error('Private JWKS-Datei nicht gefunden.');
            return null;
        }

        const jwks: JWKS = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));

        const key = jwks.keys.find((k) => k.kid === kid);

        return key || null;
    } catch (error) {
        console.error('Fehler beim Lesen der privaten JWKS-Datei:', error);
        return null;
    }
}
