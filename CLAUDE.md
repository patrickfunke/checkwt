# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production (also runs TypeScript checks)
npm run lint         # Run ESLint
npm run generate:tokens  # Generate sample tokens via scripts/generate_tokens.js
```

There is no test runner configured. Use `npm run build` to catch TypeScript errors.

## Architecture

This is a **Next.js 16 (App Router)** JWT/JWE debugger — a tool for decoding, encoding, and verifying JSON Web Tokens and JSON Web Encryption tokens.

### API Routes (`app/api/`)

- **`POST /api/decode`** — Accepts a token, detects type by dot-count (3 = JWT, 5 = JWE), decodes/decrypts it, verifies signatures, and returns `{ header, payload, signatureValid, usedKey, type }`.
- **`POST /api/encode`** — Accepts `{ header, payload, mode }` where `mode` is `'jwt'` or `'jwe'`. Generates a key pair, signs/encrypts the token, persists the keys to Supabase, and returns the token string.
- **`GET /api/keys/[keyId]`** — Retrieves a public key by `kid` from the JWKS store.
- **`GET /api/chat`** — Issues Ably token requests for the real-time chat feature.

### Key Storage (`lib/jwks-store.ts`)

All generated JWKs (public and private) are persisted in **Supabase** (table `jwks_keys`, columns: `kid`, `scope`, `jwk`). The store has a Postgres direct-connection fallback for when the Supabase PostgREST schema cache is stale. Table is auto-created on first write if it doesn't exist.

Required env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (falls back to `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `POSTGRES_URL_NON_POOLING` or `POSTGRES_URL` (for the Postgres fallback)
- Optional: `SUPABASE_JWKS_TABLE` (default: `jwks_keys`, supports `schema.table` notation)
- `ABLY_API_KEY` (for the chat feature)

### Crypto (`jose` library)

- `app/api/decode/util.ts` — JWT decoding and signature verification
- `app/api/decode/util_jwe.ts` — JWE decryption
- `app/api/encode/util.ts` — JWT signing key generation and token signing
- `app/api/encode/util_jwe.ts` — JWE encryption key generation and token encryption

### Frontend Pages & Components

- `/decode` — `DecoderForm` component: pastes token, auto-decodes on change, displays header/payload/used key with signature validity indicator
- `/encode` — `EncoderForm` component: editable JSON fields for header and payload, produces a signed JWT or encrypted JWE
- `/chat` — Real-time chat via Ably
- `/docs` — Documentation page

Shared UI primitives live in `components/ui/` (shadcn/radix-based: Button, Tabs, Textarea, etc.). App-specific components are in `app/components/`.

### Styling

Tailwind CSS v4 with dark mode via `dark:` classes. Dark background is `#111111`, card backgrounds `#17181b`, borders `#1e1e1e`.
