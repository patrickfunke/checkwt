import { readFileSync } from 'fs';
import { join } from 'path';

export interface JWK {
    kty: string;
    kid: string;
    alg?: string;
    use?: string;
    [key: string]: unknown;
}

export type JwkScope = 'public' | 'private';

// In-memory store: kid -> scope -> JWK
const store = new Map<string, Map<JwkScope, JWK>>();

function seedFromFile() {
    try {
        const filePath = join(process.cwd(), 'private', 'JWKS.json');
        const raw = readFileSync(filePath, 'utf-8');
        const json = JSON.parse(raw) as { keys: JWK[] };
        for (const jwk of json.keys) {
            if (!jwk.kid) continue;
            const scope: JwkScope = 'd' in jwk || 'k' in jwk ? 'private' : 'public';
            if (!store.has(jwk.kid)) store.set(jwk.kid, new Map());
            store.get(jwk.kid)!.set(scope, jwk);
        }
    } catch {
        // File missing or unreadable — start with empty store
    }
}

seedFromFile();

export async function getKeyById(kid: string, scope: JwkScope = 'public'): Promise<JWK | null> {
    return store.get(kid)?.get(scope) ?? null;
}

export async function getKeys(scope: JwkScope): Promise<JWK[]> {
    const result: JWK[] = [];
    for (const scopes of store.values()) {
        const jwk = scopes.get(scope);
        if (jwk) result.push(jwk);
    }
    return result;
}

export async function saveKey(jwk: JWK, scope: JwkScope): Promise<void> {
    if (!jwk.kid) throw new Error('Cannot save JWK without kid.');
    if (!store.has(jwk.kid)) store.set(jwk.kid, new Map());
    store.get(jwk.kid)!.set(scope, jwk);
}
