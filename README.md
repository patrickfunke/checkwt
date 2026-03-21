# REbuild jwt debugger
## API endpoints
- `POST /decode`: Parses a JWT token and returns its header, payload, and signature.
returns json response with the following structure:
```json
{
  "header": { ... },
  "payload": { ... },
  "signature": "..."
}
```
## Frontend Components
- **JWT-Token Field** - A text input field where users can enter their JWT token.
- **Decode Button** - A button that triggers the decoding process when clicked.
- **Decoded Header** - A display area for showing the decoded header of the JWT token.
- **Decoded Payload** - A display area for showing the decoded payload of the JWT token.
- **Decoded Signature** - A display area for showing the decoded signature of the JWT token.

## Supabase setup (Vercel)
- This project now stores JWT/JWE keys in Supabase (table: `jwks_keys`) instead of local `public/private` folders.
- Run SQL from `supabase/jwks_keys.sql` in your Supabase SQL editor.
- Configure these environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Optional: `SUPABASE_JWKS_TABLE` (default: `jwks_keys`)
