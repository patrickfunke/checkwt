create table if not exists public.jwks_keys (
  kid text not null,
  scope text not null check (scope in ('public', 'private')),
  jwk jsonb not null,
  created_at timestamptz not null default now(),
  primary key (kid, scope)
);

create index if not exists jwks_keys_scope_idx on public.jwks_keys (scope);
