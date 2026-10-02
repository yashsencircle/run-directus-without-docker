# run-directus

Directus 11.17.4 running directly on Node 22 with SQLite. No Docker.

## Requirements

Node 22, which you already have via nvm. Node 24 will not work: the
`isolated-vm` native module has no prebuilt binary for Node 24 on Apple
Silicon and fails to compile.

Your nvm default is v22.22.0, so `nvm use` is all that is needed. If you
ever find `node -v` reporting v24, run `nvm use 22` first.

## Run

```bash
cd /Users/yash/my-work/run-directus
nvm use 22
npm start
```

Opens on http://localhost:8056 (8056 avoids the Docker Directus on 8055).

Stop with Ctrl+C.

## Login

Email and password are in `.env`. `ADMIN_PASSWORD` is only read during
`bootstrap`, so changing it later requires updating the account in the UI.

## Files

| Path | Purpose |
|---|---|
| `config.json` | project, database, storage config |
| `.env` | secrets and port |
| `data.db` | SQLite database |
| `uploads/` | uploaded files |

To rebuild from scratch: `npm run bootstrap` (only on an empty database).

## Notes

SQLite has no PostGIS, so geometry field types are unavailable. Use the
Postgres Docker setup for geospatial work.
