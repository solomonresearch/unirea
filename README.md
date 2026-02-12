# Unirea

> *Reteaua absolventilor* — Alumni network platform

## Overview

Unirea is a mobile-first web app that connects highschool alumni. Users sign up, complete onboarding (profession, domain, hobbies, location), then interact with classmates through a class whiteboard, search for alumni, and browse colleagues. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

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

Run the database migrations:
```bash
npx supabase db push
```

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
│   ├── autentificare/page.tsx  # Login (/autentificare)
│   ├── inregistrare/page.tsx   # Signup (/inregistrare)
│   ├── bun-venit/page.tsx      # Welcome page (post-signup)
│   ├── onboarding/page.tsx     # Onboarding flow (profile setup)
│   ├── tabla/page.tsx          # Class whiteboard (/tabla)
│   ├── colegi/page.tsx         # Colleagues list (/colegi)
│   ├── cauta/page.tsx          # Alumni search (/cauta)
│   ├── profil/page.tsx         # User profile (/profil)
│   └── setari/page.tsx         # Settings (/setari)
├── components/
│   ├── Avatar.tsx              # Profile avatar with upload
│   ├── BottomNav.tsx           # Bottom navigation (5 tabs)
│   ├── Fireworks.tsx           # Welcome animation
│   ├── Logo.tsx                # U logo (SVG)
│   ├── MultiTagInput.tsx       # Multi-select tag input
│   ├── ProfileSection.tsx      # Editable profile card section
│   └── SearchSelect.tsx        # Searchable dropdown select
├── lib/
│   ├── supabase.ts             # Browser Supabase client
│   ├── supabase-server.ts      # Server Supabase client (SSR)
│   ├── utils.ts                # cn() utility
│   ├── professions.ts          # Romanian professions list
│   ├── domains.ts              # Professional domains list
│   ├── hobbies.ts              # Hobby options with icons
│   ├── countries.ts            # Country list
│   └── romanian-cities.ts      # Romanian cities list
├── middleware.ts                # Auth route protection
├── supabase/
│   ├── config.toml             # Supabase local config
│   └── migrations/             # Database migrations (incremental)
├── CLAUDE.md                   # Engineering standards
└── README.md                   # This file
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/autentificare` | Login |
| `/inregistrare` | Signup |
| `/bun-venit` | Welcome (post-signup) |
| `/onboarding` | Profile setup flow |
| `/tabla` | Class whiteboard — posts, votes, comments (scoped to same class) |
| `/colegi` | Colleagues — classmates + year mates from same highschool |
| `/cauta` | Search — filter alumni by profession, domain, year, class |
| `/profil` | User profile with inline editing |
| `/setari` | Settings |

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
| class | text | Class letter (A-L) |
| profession | text[] | Array of professions |
| domain | text[] | Array of domains |
| country | text | |
| city | text | |
| hobbies | text[] | Array of hobbies |
| bio | text | About me |
| avatar_url | text | Profile photo URL |
| onboarding_completed | boolean | |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto-updated via trigger |

**posts** table (class whiteboard):

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to profiles |
| content | text | Post body |
| deleted_at | timestamptz | Soft delete |
| created_at | timestamptz | Auto |

**post_votes**, **comments** — voting and commenting on posts.

RLS policies: authenticated users can read all profiles; users can only insert/update their own profile and posts.

## License

Proprietary - Solomon Research
