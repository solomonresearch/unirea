# Unirea

> *Reteaua absolventilor* — Alumni network platform

## Overview

Unirea is a mobile-first web app that connects highschool alumni. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, mobile-first responsive design
- **Icons**: Lucide React
- **Backend**: Supabase (Auth + PostgreSQL + RLS)
- **Language**: Romanian (all UI text)

## Getting Started

```bash
git clone https://github.com/solomonresearch/unirea.git
cd unirea
npm install
```

Copy environment variables:
```bash
cp .env.example .env
# Fill in your Supabase credentials
```

Run the database migration — either via CLI:
```bash
supabase db push
```

Or copy `supabase_schema.sql` into the [Supabase SQL Editor](https://supabase.com/dashboard/project/bijgvffnjplvcpnejrdn/sql).

Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

## Project Structure

```
unirea/
├── app/
│   ├── layout.tsx              # Root layout (Romanian lang)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind base styles
│   ├── autentificare/page.tsx  # Login page
│   ├── inregistrare/page.tsx   # Signup page
│   └── bun-venit/page.tsx      # Welcome page (post-login)
├── components/
│   └── Logo.tsx                # U logo (SVG)
├── lib/
│   ├── supabase.ts             # Browser Supabase client
│   ├── supabase-server.ts      # Server Supabase client (SSR)
│   └── utils.ts                # cn() utility
├── middleware.ts                # Auth route protection
├── supabase/
│   ├── config.toml             # Supabase local config
│   └── migrations/             # Database migrations
├── supabase_schema.sql         # Standalone SQL (fallback)
├── CLAUDE.md                   # Engineering standards
└── README.md                   # This file
```

## Database Schema

**profiles** table (extends Supabase Auth):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK to auth.users |
| name | text | Full name |
| username | text | Unique |
| email | text | |
| phone | text | Optional |
| highschool | text | Liceu name |
| graduation_year | integer | Anul absolvirii |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto-updated via trigger |

RLS policies: users can only read/insert/update their own profile.

## License

Proprietary - Solomon Research
