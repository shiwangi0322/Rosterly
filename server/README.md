# Rosterly API

Node.js, Express, PostgreSQL, and Prisma. The React app is unchanged and still reads LocalStorage. `src/api/client.js` is the fetch helper for a later connection.

This project uses its own PostgreSQL 18 cluster on port **5434**, because the PostgreSQL 14 and 18 services already installed on this machine require a password that is not in the repo. Nothing in those existing databases was modified.

## One-time database

From the repository root, in PowerShell:

```powershell
$pg = "C:\Program Files\PostgreSQL\18\bin"
$data = "C:\Users\Shiwangi\Downloads\rosterly\rosterly\server\.pgdata"
& "$pg\initdb.exe" -D $data -U postgres -A trust --encoding=UTF8 --locale=C
& "$pg\pg_ctl.exe" -D $data -o "-p 5434" -l "$data\server.log" start
& "$pg\createdb.exe" -h 127.0.0.1 -p 5434 -U postgres rosterly
```

Skip `initdb` and `createdb` if that data directory and database already exist. Start the cluster again after a reboot with the `pg_ctl ... start` line.

## App setup

```powershell
cd C:\Users\Shiwangi\Downloads\rosterly\rosterly\server
copy .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm start
```

The checked-in `.env` already points at `127.0.0.1:5434`. Seeded admin: `admin@datastraw.com` / `Rosterly@2026`.

`npm run db:seed` refuses to replace rows that are already there. To rebuild the sample data, set `SEED_FORCE=1` first.

## Tests

```powershell
npm test
```
