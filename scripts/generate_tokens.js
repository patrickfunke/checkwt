import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { createSecretKey, randomBytes, randomUUID } from 'crypto';
import fs from 'fs/promises';

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

  // Write outputs
  await fs.writeFile('public/JWKS.json', JSON.stringify(jwks, null, 2));
  await fs.writeFile('public/sample_tokens.json', JSON.stringify(tokens, null, 2));

  console.log('Wrote public/JWKS.json and public/sample_tokens.json with 7 tokens.');
}

gen().catch((err) => {
  console.error(err);
  process.exit(1);
});
