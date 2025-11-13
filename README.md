# Freelancer Platform

This repository bundles two apps:

- React + Vite frontend (existing `src` directory)
- Node.js backend in `/backend` written in plain JavaScript with Express, Prisma ORM, and optional Resend email support

The apps can run independently during development or be deployed separately.

## Frontend

```bash
npm install
npm run dev      # Vite dev server
npm run build    # Production build
```

## Backend (Express + Prisma + Neon PostgreSQL)

```bash
cd backend
cp .env.example .env               # fill in Neon + Resend credentials
npm install
npm run prisma:migrate -- --name init   # applies schema to Neon using the direct connection string
npm run prisma:seed                     # optional sample data
npm run dev                             # nodemon on http://localhost:5000
```

You can execute the same commands from the repository root:

```bash
npm run backend:dev
npm run backend:build
npm run backend:start
npm run backend:prisma:studio
```

### Environment variables (`backend/.env`)

```env
DATABASE_URL="postgresql://neondb_owner:npg_RVI8UbL2HDik@ep-nameless-bar-a1q9980g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_DATABASE_URL="postgresql://neondb_owner:npg_RVI8UbL2HDik@ep-nameless-bar-a1q9980g.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=5000
CORS_ORIGIN=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="Freelancer Platform <noreply@example.com>"
JWT_SECRET="super-secret-jwt-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"
PASSWORD_PEPPER="another-long-secret-value"
PASSWORD_SALT_ROUNDS=12
```

- `DATABASE_URL` should be the **pooled** Neon connection string (PgBouncer). The API server and Prisma client use this for day-to-day queries.
- `DIRECT_DATABASE_URL` should be the **direct** Neon connection string. Prisma migrations and `prisma db push` automatically switch to it when available, which avoids pooling limits.
- Leave the Resend values empty to skip email sending locally.

### Backend structure

```
backend/
  package.json
  prisma/
    schema.prisma
    seed.js
  src/
    app.js
    server.js
    config/env.js
    lib/
      prisma.js
      resend.js
    middlewares/
    routes/
    modules/
      users/
```

### Resend integration

When `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set, the user service sends a welcome email via Resend after each successful `POST /api/users` call. Missing credentials simply disable the email step while leaving the API response untouched.

### API snapshot

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Connectivity + Neon database check |
| `GET /api/users?role=FREELANCER` | List users (optional role filter) |
| `POST /api/users` | Create a user (welcome email sent when Resend is configured) |
| `POST /api/auth/signup` | Register a user with salted + peppered password hashing and receive a JWT |
| `POST /api/auth/login` | Validate credentials and receive a JWT |

Routes follow this pattern: Zod schemas -> `validateResource` middleware -> controller -> Prisma-backed service.

### Prisma workflow with Neon

- `npm run prisma:migrate -- --name <label>` – creates/applies migrations against Neon (uses `DIRECT_DATABASE_URL` when present).
- `npm run prisma:generate` – regenerates the Prisma client after schema edits.
- `npm run prisma:studio` – opens Prisma Studio, which can connect to the pooled `DATABASE_URL`.
- `npm run prisma:seed` – inserts the sample client/freelancer/project/proposal data set.

Whenever you rotate Neon credentials, update both connection strings, rerun `npm run prisma:generate`, and restart the backend so Prisma reconnects cleanly.

### Next steps

- Mirror the `users` module to add projects, proposals, etc.
- Propagate the authenticated session across the rest of the frontend (protected dashboards, client views, etc.).
- Deploy: ship the backend to any Node-friendly host (Neon pairs well with Railway, Render, Fly.io, AWS, Vercel functions, etc.) and either proxy it behind the frontend domain or expose it separately with HTTPS.
