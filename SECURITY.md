# Security

Please report vulnerabilities privately through GitHub Security Advisories on
the repository. Do not include GitHub tokens, `ADMIN_SECRET` values, or
private repository data in an issue.

## Operational notes

- `ADMIN_SECRET` must be a random value with at least 24 characters. Rotating
  it intentionally makes previously encrypted tokens unreadable.
- GitHub credentials are encrypted with AES-GCM before being written to
  `data/config.json`. The data directory is created with restrictive
  permissions, and the file is written atomically with mode `0600`.
- Admin API responses never return stored tokens.
- Admin sessions are HMAC-signed, `HttpOnly`, `SameSite=Lax`, and use the
  `Secure` attribute when the public request is HTTPS.
- Unsafe admin requests validate the `Origin` header and require an active
  session. Login attempts are rate-limited in memory.
- The card endpoint only returns aggregate public GitHub data. GraphQL queries
  explicitly request public repositories.
- Backgrounds are compressed in the visitor's browser and sent as a bounded
  `bgData` value. The server decodes at most 18 KB and does not proxy or store
  the original image.
- `bg` and `photo` URLs must use HTTPS. Server-side background fetching is
  disabled unless `ALLOW_SERVER_BACKGROUND_FETCH=true`; remote avatar fetching
  outside the trusted host allowlist is disabled unless
  `ALLOW_REMOTE_ASSET_FETCH=true`. Enabling either option increases bandwidth
  use and the outbound-request attack surface.
- Reverse proxies must allow the bounded `bgData` query string. The Node adapter
  caps headers at 64 KB; gateway configuration is deployment-owned. Request
  logs redact background and avatar parameters.

Run the service behind HTTPS in production. Keep the Docker port bound to
`127.0.0.1` and expose it through a reverse proxy.
