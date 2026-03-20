Quick test instructions — Decode helper

Prerequisites
- Node.js 18+ installed
- From project root: run `npm install` to install dependencies (project already includes `jose`).

Recommended (run TypeScript test directly)
1. Install dev tools (one-time):

```bash
npm install -D ts-node typescript
```

2. Run the decode test:

```bash
npx ts-node ./app/api/decode/test.ts
```

Notes
- If you see the ESM warning, add `"type": "module"` to `package.json` or run via `ts-node` as above.
- The test reads the JWKS from `public/JWKS.json`; to verify signatures ensure the `kid` in the token header matches an entry there.
- To run the test from plain JS: transpile with `npx tsc` then `node ./app/api/decode/test.js` (adjust path if needed).
