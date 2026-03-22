import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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

const JWKS_PATH = join(process.cwd(), 'private', 'JWKS.json');

function readFromFile(): JWK[] {
    try {
        const raw = readFileSync(JWKS_PATH, 'utf-8');
        return (JSON.parse(raw) as { keys: JWK[] }).keys ?? [];
    } catch {
        return [];
    }
}

function writeToFile(): void {
    try {
        const keys: JWK[] = [];
        for (const scopes of store.values()) {
            for (const jwk of scopes.values()) keys.push(jwk);
        }
        mkdirSync(join(process.cwd(), 'private'), { recursive: true });
        writeFileSync(JWKS_PATH, JSON.stringify({ keys }, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to persist JWKS:', e);
    }
}

export async function getKeyById(kid: string, scope: JwkScope = 'public'): Promise<JWK | null> {
    // Always read from file so separate route-module instances stay in sync
    const keys = readFromFile();
    // Multiple entries can share the same kid (public + private pair) — find the right scope
    const matches = keys.filter(k => k.kid === kid);
    for (const match of matches) {
        const isPrivate = 'd' in match || 'k' in match;
        const matchScope: JwkScope = isPrivate ? 'private' : 'public';
        if (matchScope === scope) return match;
    }
    return null;
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
    writeToFile();
}
