import { getKeyById as getSupabaseKeyById, JWK } from '@/lib/jwks-store';

/**
 * Gibt den JWK-Schlüssel mit der angegebenen `kid` zurück.
 * @param kid Die Key ID des gesuchten Schlüssels.
 * @returns Den gefundenen Schlüssel oder `null`, falls nicht gefunden.
 */
export async function getKeyById(kid: string): Promise<JWK | null> {
    try {
        return await getSupabaseKeyById(kid, 'public');
    } catch (error) {
        console.error('Fehler beim Laden des Public Keys aus Supabase:', error);
        return null;
    }
}

/**
 * Wie `getKeyById`, aber liest den privaten Schlüssel aus Supabase.
 * Wird für JWE/Entschlüsselung verwendet, da dort private Schlüssel nötig sind.
 */
export async function getPrivateKeyById(kid: string): Promise<JWK | null> {
    try {
        return await getSupabaseKeyById(kid, 'private');
    } catch (error) {
        console.error('Fehler beim Laden des Private Keys aus Supabase:', error);
        return null;
    }
}
