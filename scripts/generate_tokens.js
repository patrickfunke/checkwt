import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createSecretKey, randomBytes, randomUUID } from 'crypto';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key).');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getTableConfig() {
  const raw = (process.env.SUPABASE_JWKS_TABLE || 'jwks_keys').trim();
  const parts = raw.split('.').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { schema: parts[0], table: parts[1] };
  return { schema: 'public', table: parts[0] || 'jwks_keys' };
}

async function gen() {
  const now = Math.floor(Date.now() / 1000);
  const payloadBase = {
    country: 'global',
    description: '',
    environment: 'test',
    product: 'globalcustomeraccount'
  };

  const jwks = { keys: [] };
  const tokens = [];

  const asymAlgs = ['EdDSA', 'RS256', 'PS256', 'ES256', 'ES384', 'ES512'];

  for (const alg of asymAlgs) {
    const { publicKey, privateKey } = await generateKeyPair(alg);
    const pubJwk = await exportJWK(publicKey);
    pubJwk.use = 'sig';
    pubJwk.alg = alg;
    pubJwk.kid = randomUUID();
    jwks.keys.push(pubJwk);

    const token = await new SignJWT({ ...payloadBase })
      .setProtectedHeader({ alg, kid: pubJwk.kid })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(privateKey);

    tokens.push({ alg, kid: pubJwk.kid, token });
  }

  // HS256 symmetric key
  const hsKid = randomUUID();
  const secret = randomBytes(32);
  const jwkOct = {
    kty: 'oct',
    k: Buffer.from(secret).toString('base64url'),
    alg: 'HS256',
    use: 'sig',
    kid: hsKid
  };
  jwks.keys.push(jwkOct);

  const hsToken = await new SignJWT({ ...payloadBase })
    .setProtectedHeader({ alg: 'HS256', kid: hsKid })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(createSecretKey(secret));

  tokens.push({ alg: 'HS256', kid: hsKid, token: hsToken });

  // Persist public keys in Supabase
  const supabase = getSupabaseClient();
  const { schema, table } = getTableConfig();
  const rows = jwks.keys.map((jwk) => ({ kid: jwk.kid, scope: 'public', jwk }));
  const { error } = await supabase.schema(schema).from(table).upsert(rows, { onConflict: 'kid,scope' });
  if (error) {
    throw new Error(`Failed to upsert JWKS into Supabase: ${error.message}`);
  }

  // Write token samples only
  await fs.writeFile('public/sample_tokens.json', JSON.stringify(tokens, null, 2));

  console.log('Stored JWKS in Supabase and wrote public/sample_tokens.json with 7 tokens.');
}

gen().catch((err) => {
  console.error(err);
  process.exit(1);
});
