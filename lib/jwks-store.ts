import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

export interface JWK {
    kty: string;
    kid: string;
    alg?: string;
    use?: string;
    [key: string]: unknown;
}

export type JwkScope = 'public' | 'private';

type JwksRow = {
    kid: string;
    scope: JwkScope;
    jwk: JWK;
};

let sqlClient: postgres.Sql | null = null;

function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key) are required.');
    }

    return { url, key };
}

function getTableConfig() {
    const raw = (process.env.SUPABASE_JWKS_TABLE || 'jwks_keys').trim();
    if (!raw) {
        return { schema: 'public', table: 'jwks_keys' };
    }

    const parts = raw.split('.').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
        return { schema: parts[0], table: parts[1] };
    }

    return { schema: 'public', table: parts[0] };
}

function getSupabaseClient() {
    const { url, key } = getSupabaseCredentials();
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

function isSafeIdentifier(value: string) {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function getSqlClient() {
    if (sqlClient) {
        return sqlClient;
    }

    const url =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL;

    if (!url) {
        throw new Error('Missing Postgres connection env var (POSTGRES_URL_NON_POOLING, POSTGRES_URL or POSTGRES_PRISMA_URL).');
    }

    sqlClient = postgres(url, {
        prepare: false,
        max: 1,
    });

    return sqlClient;
}

async function ensureTableExists(schema: string, table: string) {
    if (!isSafeIdentifier(schema) || !isSafeIdentifier(table)) {
        throw new Error('Invalid schema/table identifier for JWKS store.');
    }

    const sql = getSqlClient();
    await sql.unsafe(`
        create table if not exists "${schema}"."${table}" (
            kid text not null,
            scope text not null check (scope in ('public', 'private')),
            jwk jsonb not null,
            created_at timestamptz not null default now(),
            primary key (kid, scope)
        );
    `);
    await sql.unsafe(`
        create index if not exists ${table}_scope_idx on "${schema}"."${table}" (scope);
    `);
}

function shouldUsePostgresFallback(message: string) {
    const m = message.toLowerCase();
    return m.includes('schema cache') || m.includes('could not find the table');
}

async function getKeyByIdViaPostgres(kid: string, scope: JwkScope, schema: string, table: string): Promise<JWK | null> {
    await ensureTableExists(schema, table);
    const sql = getSqlClient();
    const rows = await sql.unsafe(`
        select jwk
        from "${schema}"."${table}"
        where kid = $1 and scope = $2
        limit 1
    `, [kid, scope]) as Array<{ jwk: JWK }>;
    return rows[0]?.jwk || null;
}

async function getKeysViaPostgres(scope: JwkScope, schema: string, table: string): Promise<JWK[]> {
    await ensureTableExists(schema, table);
    const sql = getSqlClient();
    const rows = await sql.unsafe(`
        select jwk
        from "${schema}"."${table}"
        where scope = $1
    `, [scope]) as Array<{ jwk: JWK }>;
    return rows.map((row) => row.jwk);
}

async function saveKeyViaPostgres(jwk: JWK, scope: JwkScope, schema: string, table: string): Promise<void> {
    await ensureTableExists(schema, table);
    const sql = getSqlClient();
    await sql.unsafe(`
        insert into "${schema}"."${table}" (kid, scope, jwk)
        values ($1, $2, $3::jsonb)
        on conflict (kid, scope)
        do update set jwk = excluded.jwk
    `, [jwk.kid, scope, JSON.stringify(jwk)]);
}

export async function getKeyById(kid: string, scope: JwkScope = 'public'): Promise<JWK | null> {
    const supabase = getSupabaseClient();
    const { schema, table } = getTableConfig();

    try {
        const { data, error } = await supabase
            .schema(schema)
            .from(table)
            .select('jwk')
            .eq('kid', kid)
            .eq('scope', scope)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return (data?.jwk as JWK | undefined) || null;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!shouldUsePostgresFallback(message)) {
            throw new Error(`Failed to load key '${kid}' from Supabase: ${message}`);
        }

        return await getKeyByIdViaPostgres(kid, scope, schema, table);
    }
}

export async function getKeys(scope: JwkScope): Promise<JWK[]> {
    const supabase = getSupabaseClient();
    const { schema, table } = getTableConfig();

    try {
        const { data, error } = await supabase
            .schema(schema)
            .from(table)
            .select('jwk')
            .eq('scope', scope);

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map((row: { jwk: JWK }) => row.jwk);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!shouldUsePostgresFallback(message)) {
            throw new Error(`Failed to load ${scope} keys from Supabase: ${message}`);
        }

        return await getKeysViaPostgres(scope, schema, table);
    }
}

export async function saveKey(jwk: JWK, scope: JwkScope): Promise<void> {
    if (!jwk.kid) {
        throw new Error('Cannot save JWK without kid.');
    }

    const row: JwksRow = {
        kid: jwk.kid,
        scope,
        jwk,
    };

    const supabase = getSupabaseClient();
    const { schema, table } = getTableConfig();

    try {
        const { error } = await supabase
            .schema(schema)
            .from(table)
            .upsert(row, { onConflict: 'kid,scope' });

        if (error) {
            throw new Error(error.message);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!shouldUsePostgresFallback(message)) {
            throw new Error(`Failed to save key '${jwk.kid}' to Supabase: ${message}`);
        }

        await saveKeyViaPostgres(jwk, scope, schema, table);
    }
}
