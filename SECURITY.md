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
- Images are compressed in the visitor's browser and uploaded as WebP with a
  1 MB hard limit. The server validates the WebP signature and dimensions
  before writing the file and manifest to the configured store.
- With `IMAGE_STORAGE_DRIVER=google-drive`, image files and the manifest are
  written to the configured Google Drive folder instead of `data/images/`.
  The local disk retains only `data/config.json` and a small in-memory image
  cache. Drive is a remote dependency: an outage makes the image library
  return `503`, while profile-card reads and site configuration can continue.
- `GOOGLE_DRIVE_REFRESH_TOKEN`, `GOOGLE_DRIVE_CLIENT_SECRET`,
  `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64`, and service-account private keys
  are server-side secrets. Do not place them in browser code, image URLs,
  repository files, logs, or issue reports. The OAuth helper writes generated
  credentials with mode `0600` and never sends them to this service.
- The Google Drive OAuth flow requests the full
  `https://www.googleapis.com/auth/drive` scope because the instance must write
  into an existing folder selected by its owner. Use a dedicated Google
  account or Workspace service account, grant access only to the image-library
  folder, and revoke the OAuth grant if the instance is retired.
- Guest uploads remain unpublished until an administrator approves them.
  Guest upload routes are same-origin checked and rate-limited to eight
  attempts per hour per address.
- Public image assets are immutable and only expose published images.
  Unpublished images require a valid administrator session.
- The card API accepts a published image UUID through `bgImage`; it does not
  accept arbitrary background or avatar URLs and does not proxy user-supplied
  images. GitHub avatars may use the trusted host allowlist, and
  `ALLOW_REMOTE_ASSET_FETCH=true` should remain off unless there is a concrete
  operational need.
- Reverse proxies should allow upload bodies up to about 2 MB. The Node adapter
  enforces the image size limit; gateway configuration is deployment-owned.
  Request logs redact sensitive query parameters.

Run the service behind HTTPS in production. Keep the Docker port bound to
`127.0.0.1` and expose it through a reverse proxy.
