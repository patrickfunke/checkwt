import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportJWK, SignJWT, importPKCS8 } from 'jose';
import { createPrivateKey, createPublicKey } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env.local.example');

function readPem(named) {
  const data = fs.readFileSync(envPath, 'utf8');
  const idx = data.indexOf(named + '=');
  if (idx === -1) throw new Error('Key not found: ' + named);
  // find the first BEGIN after the key name
  const beginIdx = data.indexOf('-----BEGIN', idx);
  if (beginIdx === -1) throw new Error('BEGIN not found for ' + named);
  const endMarkerIdx = data.indexOf('-----END', beginIdx);
  if (endMarkerIdx === -1) throw new Error('END not found for ' + named);
  // find end of the END line
  const endLineIdx = data.indexOf('-----', endMarkerIdx + 5);
  const pem = data.slice(beginIdx, endLineIdx + 5).trim();
  return pem;
}

async function build() {
  const privateEd = readPem('private_key_ed');
  const publicEd = readPem('public_key_ed');

  const privateRsa = readPem('private_key_rsa');
  const publicRsa = readPem('public_key_rsa');

  const privateEc = readPem('private_key_ec');
  const publicEc = readPem('public_key_ec');

  // Import PKCS8 private keys (ed25519 and ec are PKCS8)
  const keyEd = await importPKCS8(privateEd, 'EdDSA');
  const keyEc = await importPKCS8(privateEc, 'ES256');

  // RSA private key is PKCS#1: convert to PKCS#8 using crypto then import
  const rsaKeyObj = createPrivateKey({ key: privateRsa, format: 'pem' });
  const keyRsa = rsaKeyObj; // use KeyObject directly for RSA signing

  // Create public KeyObjects and export JWKs
  const pubEd = createPublicKey({ key: publicEd, format: 'pem' });
  const pubRsa = createPublicKey({ key: publicRsa, format: 'pem' });
  const pubEc = createPublicKey({ key: publicEc, format: 'pem' });

  const jwkEd = await exportJWK(pubEd);
  jwkEd.kid = 'ed1';
  jwkEd.alg = 'EdDSA';
  jwkEd.use = 'sig';

  const jwkRsa = await exportJWK(pubRsa);
  jwkRsa.kid = 'rsa1';
  jwkRsa.alg = 'RS256';
  jwkRsa.use = 'sig';

  const jwkEc = await exportJWK(pubEc);
  jwkEc.kid = 'ec1';
  jwkEc.alg = 'ES256';
  jwkEc.use = 'sig';

  const jwks = { keys: [jwkEd, jwkRsa, jwkEc] };

  // Generate 7 sample tokens with varying alg/kid
  const tokens = [];

  const now = Math.floor(Date.now() / 1000);

  async function signWith(key, alg, kid, extra = {}) {
    const jwt = await new SignJWT({ iss: 'test-issuer', aud: 'test-audience', ...extra })
      .setProtectedHeader({ alg, kid })
      .setIssuedAt(now)
      .setExpirationTime(now + 60 * 60)
      .setJti(Math.random().toString(36).slice(2))
      .sign(key);
    return jwt;
  }

  tokens.push({ alg: 'EdDSA', kid: 'ed1', token: await signWith(keyEd, 'EdDSA', 'ed1', { sub: 'user:ed' }) });
  tokens.push({ alg: 'RS256', kid: 'rsa1', token: await signWith(keyRsa, 'RS256', 'rsa1', { sub: 'user:rsa' }) });
  tokens.push({ alg: 'ES256', kid: 'ec1', token: await signWith(keyEc, 'ES256', 'ec1', { sub: 'user:ec' }) });

  // additional variants
  tokens.push({ alg: 'RS256', kid: 'rsa1', token: await signWith(keyRsa, 'RS256', 'rsa1', { sub: 'user:rsa2', role: 'admin' }) });
  tokens.push({ alg: 'ES256', kid: 'ec1', token: await signWith(keyEc, 'ES256', 'ec1', { sub: 'user:ec2', scope: 'read' }) });
  tokens.push({ alg: 'EdDSA', kid: 'ed1', token: await signWith(keyEd, 'EdDSA', 'ed1', { sub: 'user:ed2', exp: now + 120 }) });
  tokens.push({ alg: 'RS256', kid: 'rsa1', token: await signWith(keyRsa, 'RS256', 'rsa1', { sub: 'user:rsa3', custom: 'value' }) });

  // Write outputs
  const outJwks = path.resolve(__dirname, '..', 'public', 'JWKS.json');
  const outTokens = path.resolve(__dirname, '..', 'public', 'sample_tokens.json');

  fs.writeFileSync(outJwks, JSON.stringify(jwks, null, 2), 'utf8');
  fs.writeFileSync(outTokens, JSON.stringify(tokens, null, 2), 'utf8');

  console.log('Wrote', outJwks);
  console.log('Wrote', outTokens);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
