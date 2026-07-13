# Optional content pack

The browser loads `js/extra-content.js`, a small generated lookup loader. After a
valid alias is entered, it lazily loads `js/extra-content.pack.js`, the encrypted
content payload. Plaintext authoring source is intentionally not tracked by this
repository.

Local authoring files live under `.content-src/`, which is gitignored. Keep that
directory backed up in access-controlled storage or a private repository. To rebuild
the checked-in artifact after editing the private source:

```sh
node scripts/build-extra-content.js
```

The bundled LAN server serves only top-level web assets plus the `assets/`, `css/`,
and `js/` trees. Private authoring data, telemetry, repository metadata, scripts,
and documentation are outside that allowlist. Do not serve the repository root
with a generic static server while the private authoring directory is present;
many such servers expose ignored files by default.

The builder:

- embeds private image assets into the payload;
- compresses and encrypts the complete module with AES-256-GCM;
- segments ciphertext so random Base64 cannot accidentally expose a full alias
  in repository search results;
- keeps the large ciphertext off the base game's critical loading path;
- binds loader and payload versions and cache-busts payload requests so mixed
  deployments fail closed instead of installing stale content;
- stores only PBKDF-derived alias fingerprints in the public lookup table, so
  offline dictionary guesses pay the full work factor;
- wraps the content key independently for each normalized alias using derived
  HMAC keys and AES-GCM.

The ignored manifest contains a private build seed. Keys and nonces are derived from
that seed plus the source digest, so a no-op rebuild is byte-for-byte stable while a
content change produces a new authenticated ciphertext. Do not move that seed into
the tracked tree.

At runtime, an entered player name is normalized and passed through one cached
PBKDF2 lookup. A matching name unwraps and installs the content pack asynchronously.
Existing public avatars remain synchronous.

This protects against repository browsing and casual string/dictionary inspection.
It is not DRM: a player who already knows a valid alias can instrument their browser
and capture the authenticated plaintext after it is unlocked. Keeping content truly
secret after delivery would require a remote service and would break offline play.

The loader requires Web Crypto and `DecompressionStream`. If either API is
unavailable, the base game still runs; only the optional pack remains unloaded.
