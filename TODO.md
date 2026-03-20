- [ ] Den Signing-Key bei JWTs mit anzeigen
- [ ] Tooltips über den einzelnen Teilen mit Erklärung

# JWEs Format
```
BASE64URL(UTF8(JWE Protected Header)) || '.' ||
BASE64URL(JWE Encrypted Key) || '.' ||
BASE64URL(JWE Initialization Vector) || '.' ||
BASE64URL(JWE Ciphertext) || '.' ||
BASE64URL(JWE Authentication Tag)
```