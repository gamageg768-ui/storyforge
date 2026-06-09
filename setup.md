# StoryForge — Setup Instructions

## Prerequisites

- Node.js 18+ installed
- A PostgreSQL database (Neon, Supabase, or local Postgres)
- Git (optional)

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment Variables

Copy `.env.local` and fill in your values:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host/storyforge"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"

NEXTAUTH_URL="http://localhost:3000"
```

### Option: SQLite (zero-config local dev)

If you want zero-config local development, edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

And set in `.env.local`:

```env
DATABASE_URL="file:./dev.db"
```

---

## 3. Set Up the Database

Push the schema:

```bash
npx prisma db push
```

Generate the Prisma client:

```bash
npx prisma generate
```

---

## 4. Seed the Database (Optional but Recommended)

Seeds 8 authors, 8 stories with chapters, reactions, comments, ratings, and follows:

```bash
npm run db:seed
```

Demo accounts created by seed (all use password `demo1234`):
- `elena@sf.app` — ElenaVoss
- `marcus@sf.app` — MarcusThorn
- `lily@sf.app` — LilyMoon
- `raven@sf.app` — RavenBlack
- `jade@sf.app` — JadeWillow
- `owen@sf.app` — OwenStorm
- `cassandra@sf.app` — CassandraFire
- `theodore@sf.app` — TheodorePen
- `demo@storyforge.app` — DemoUser (also auto-created via the "Try Demo Account" button)

---

## 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 6. Build for Production

```bash
npm run build
npm start
```

---

## 7. Deploy to Vercel

```bash
vercel
```

Set environment variables in the Vercel dashboard:
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL` (set to your production domain)

---

## Troubleshooting

**Prisma client not found**: Run `npx prisma generate`

**Database connection errors**: Double-check `DATABASE_URL` format. For Neon, use the connection pooling URL.

**NextAuth errors**: Make sure `AUTH_SECRET` is set and `NEXTAUTH_URL` matches your actual URL.

**PWA icons**: The `/public/icons/` directory needs `icon-192.png` and `icon-512.png`. Any square PNG images will work. The app functions without them but the install prompt may not appear.
