# Security

Please report vulnerabilities privately through GitHub Security Advisories on
the repository. Do not include GitHub tokens, `ADMIN_SECRET` values, OAuth
client secrets, or private repository data in an issue.

## Operational notes

- `ADMIN_SECRET` must be a random value with at least 24 characters. Rotating
  it intentionally makes previously encrypted tokens unreadable.
- GitHub credentials are encrypted with AES-GCM before being written to
  `data/config.json`. The data directory is created with restrictive
  permissions, and the file is written atomically with mode `0600`.
- Admin API responses never return stored tokens or client secrets.
- Admin sessions are HMAC-signed, `HttpOnly`, `SameSite=Lax`, and use the
  `Secure` attribute when the public request is HTTPS.
- Unsafe admin requests validate the `Origin` header and require an active
  session. Login attempts are rate-limited in memory.
- The card endpoint only returns aggregate public GitHub data. GraphQL queries
  explicitly request public repositories.
- Background and avatar URLs must use HTTPS. Known image hosts are fetched and
  converted to data URIs; other HTTPS URLs are embedded directly in the SVG.

Run the service behind HTTPS in production. Keep the Docker port bound to
`127.0.0.1` and expose it through a reverse proxy.
