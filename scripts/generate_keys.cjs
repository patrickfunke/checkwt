const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

function generateAndWrite() {
  const ed = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  const rsa = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicExponent: 0x10001,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  });

  const ec = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  const envPath = path.resolve(__dirname, '..', '.env.local.example');

  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, envPath + '.bak');
    console.log('Backup created at', envPath + '.bak');
  }

  const content = [
    'private_key_ed=' + '\n' + ed.privateKey,
    'public_key_ed=' + '\n' + ed.publicKey,
    '',
    'private_key_rsa=' + '\n' + rsa.privateKey,
    'public_key_rsa=' + '\n' + rsa.publicKey,
    '',
    'private_key_ec=' + '\n' + ec.privateKey,
    'public_key_ec=' + '\n' + ec.publicKey,
    ''
  ].join('\n');

  fs.writeFileSync(envPath, content, { encoding: 'utf8' });
  console.log('Wrote plaintext PEM keys to', envPath);
}

generateAndWrite();
