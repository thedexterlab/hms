# Mastan Hospital Management System

React/Vite frontend with an ASP.NET Core 10 API under `backend/`.

## Run with the ASP.NET backend

The backend uses XAMPP's MariaDB (MySQL protocol). Start **MySQL** from the XAMPP control panel (default: `127.0.0.1:3306`, user `root`, empty password), then create the database once:

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' -u root -e "CREATE DATABASE IF NOT EXISTS hms CHARACTER SET utf8mb4;"
```

A development connection string is already configured in `backend/Hms.Api/appsettings.Development.json`. Override it with a user secret for anything non-default:

```powershell
dotnet user-secrets set --project backend/Hms.Api "ConnectionStrings:Hms" "Server=127.0.0.1;Port=3306;Database=hms;User=root;Password=YOUR_PASSWORD"
```

Then open two terminals from the repository root:

```powershell
npm run api
```

```powershell
npm run dev:api
```

The API listens on `http://localhost:5127`; the frontend uses `.env.backend` and normally listens on `http://localhost:5173`. On startup, the API applies pending EF Core migrations to MariaDB.

Development-only seeded users:

- `reception@example.com` / `Reception@123`
- `doctor.opd@mastan.local` / `Doctor@123`
- `doctor@master.local` / `Doctor@123`

Seed data is enabled only in Development. Passwords are stored as ASP.NET password hashes, not plaintext. Change or disable seed accounts before using non-demo data. Use `npm run dev` for frontend-only mock mode.

## API scope

Implemented:

- JWT access tokens and rotating hashed refresh tokens
- login throttling and account lockout
- claim-based permission policies
- PostgreSQL persistence with versioned EF Core migrations
- database-enforced unique MRN/CNIC, appointment-slot and daily-token constraints
- database check constraints, bounded columns, foreign keys, and `jsonb` audit/change payloads
- patient creation, search, detail, duplicate checks, and whitelist-only amendments
- optimistic concurrency and append-only patient amendment records
- appointment creation/listing with duplicate protection and daily department tokens
- audit events for patient and appointment mutations
- exact-origin CORS and database health checks

API routes begin at `/api`; health is available at `/health`.

## Verification

```powershell
dotnet test backend/Hms.slnx
npm test -- --run
npm run build
```

## Production boundary

This is a secure foundation, not a production-ready hospital platform. Before handling real patient data, use managed PostgreSQL with a non-superuser application role, review migrations, store database/JWT secrets in a secret manager, use TLS at the ingress and for database connections, move refresh tokens to Secure/HttpOnly cookies, encrypt sensitive fields and backups, add centralized immutable audit storage, backup/restore drills, MFA, observability, and jurisdiction-specific compliance review. Clinical, pharmacy, billing, laboratory, inventory, FHIR, and DICOM modules are not yet implemented.
