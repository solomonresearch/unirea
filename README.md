# Unirea

> *Reteaua absolventilor* — Alumni network platform

## Overview

Unirea is a mobile-first web app that connects highschool alumni. Users sign up, complete onboarding (profession, domain, hobbies, location), then interact with classmates through a class whiteboard, search for alumni, browse colleagues, message each other, and manage shared tasks on a Kanban board. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, mobile-first responsive design
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit (Kanban board)
- **Backend**: Supabase (Auth + PostgreSQL + RLS)
- **API**: Next.js Route Handlers (`app/api/`)
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
│   ├── layout.tsx                   # Root layout (Romanian lang)
│   ├── page.tsx                     # Landing page
│   ├── globals.css                  # Tailwind base styles
│   ├── autentificare/page.tsx       # Login (/autentificare)
│   ├── inregistrare/page.tsx        # Signup (/inregistrare)
│   ├── bun-venit/page.tsx           # Welcome page (post-signup)
│   ├── onboarding/page.tsx          # Onboarding flow (profile setup)
│   ├── resetare-parola/page.tsx     # Password reset request
│   ├── resetare-parola/confirmare/  # Password reset confirmation
│   ├── tabla/page.tsx               # Class whiteboard (/tabla)
│   ├── avizier/page.tsx             # Notice board (/avizier)
│   ├── colegi/page.tsx              # Colleagues list (/colegi)
│   ├── colegi/[id]/page.tsx         # Colleague profile detail
│   ├── mesaje/page.tsx              # Conversations list (/mesaje)
│   ├── mesaje/[id]/page.tsx         # Chat thread
│   ├── cauta/page.tsx               # Alumni search (/cauta)
│   ├── kanban/page.tsx              # Kanban board (/kanban)
│   ├── profil/page.tsx              # User profile (/profil)
│   ├── setari/page.tsx              # Settings (/setari)
│   └── api/
│       └── kanban/
│           ├── route.ts             # GET (list), POST (create) cards
│           └── [id]/route.ts        # PATCH (update/move), DELETE card
├── components/
│   ├── Avatar.tsx                   # Profile avatar with upload
│   ├── BottomNav.tsx                # Bottom navigation (6 tabs)
│   ├── Fireworks.tsx                # Welcome animation
│   ├── Logo.tsx                     # U logo (SVG)
│   ├── MultiTagInput.tsx            # Multi-select tag input
│   ├── ProfileSection.tsx           # Editable profile card section
│   ├── SearchSelect.tsx             # Searchable dropdown select
│   ├── kanban/
│   │   ├── KanbanCard.tsx           # Draggable card (normal/compact/overlay)
│   │   └── KanbanColumn.tsx         # Droppable column with filter
│   └── ui/                          # Reusable UI primitives (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── textarea.tsx
├── lib/
│   ├── supabase.ts                  # Browser Supabase client
│   ├── supabase-server.ts           # Server Supabase client (SSR/API)
│   ├── utils.ts                     # cn() utility
│   ├── professions.ts               # Romanian professions list
│   ├── domains.ts                   # Professional domains list
│   ├── hobbies.ts                   # Hobby options with icons
│   ├── countries.ts                 # Country list
│   └── romanian-cities.ts           # Romanian cities list
├── middleware.ts                     # Auth route protection
├── supabase/
│   ├── config.toml                  # Supabase local config
│   └── migrations/                  # Database migrations (incremental)
├── CLAUDE.md                        # Engineering standards
└── README.md                        # This file
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/autentificare` | Login |
| `/inregistrare` | Signup |
| `/bun-venit` | Welcome (post-signup) |
| `/onboarding` | Profile setup flow |
| `/resetare-parola` | Password reset request |
| `/resetare-parola/confirmare` | Password reset — set new password |
| `/tabla` | Class whiteboard — posts, votes, comments (scoped to same class) |
| `/avizier` | Notice board |
| `/colegi` | Colleagues — classmates + year mates from same highschool |
| `/colegi/[id]` | Colleague profile detail |
| `/mesaje` | Conversations list |
| `/mesaje/[id]` | Chat thread |
| `/cauta` | Search — filter alumni by profession, domain, year, class |
| `/kanban` | Kanban board — drag-and-drop task management with realtime sync |
| `/profil` | User profile with inline editing |
| `/setari` | Settings |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/kanban` | `GET` | List all kanban cards (with creator name) |
| `/api/kanban` | `POST` | Create a new card (title, description, status) |
| `/api/kanban/[id]` | `PATCH` | Update a card (move column, reorder, edit) |
| `/api/kanban/[id]` | `DELETE` | Delete a card |

All API routes authenticate via server-side Supabase client — return 401 if not logged in.

### Authentication

All requests must include the Supabase auth session cookie (set automatically when logged in via the browser). For programmatic access, pass the `sb-<ref>-auth-token` cookie.

### Examples

**List all cards:**
```bash
GET /api/kanban
```
Response:
```json
[
  {
    "id": "5b6572ee-cc95-4aaa-b5e5-1ebb1d401702",
    "title": "Design homepage",
    "description": "Create mockups for the landing page",
    "status": "in_progress",
    "position": 0,
    "card_number": 1,
    "created_by": "a1b2c3d4-...",
    "creator_name": "Ion Popescu",
    "created_at": "2026-02-18T08:56:34.646Z",
    "updated_at": "2026-02-18T09:09:36.541Z"
  }
]
```

**Create a card:**
```bash
POST /api/kanban
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Users can't log in on Safari",
  "status": "todo"
}
```
Response (`201`):
```json
{
  "id": "new-uuid-here",
  "title": "Fix login bug",
  "description": "Users can't log in on Safari",
  "status": "todo",
  "position": 0,
  "card_number": 2,
  "created_by": "your-user-id",
  "creator_name": "Ion Popescu",
  "created_at": "...",
  "updated_at": "..."
}
```

- `title` (string, required) — card title
- `description` (string, optional) — card description
- `status` (string, required) — one of `"todo"`, `"in_progress"`, `"done"`
- `position` is calculated automatically (appended to end of column)
- `card_number` is auto-incremented by the database
- `created_by` is set automatically from the authenticated user

**Move a card to another column:**
```bash
PATCH /api/kanban/{id}
Content-Type: application/json

{
  "status": "done",
  "position": 0
}
```
Response: the updated card object.

**Edit a card's title and description:**
```bash
PATCH /api/kanban/{id}
Content-Type: application/json

{
  "title": "Fix login bug (Safari + Firefox)",
  "description": "Updated scope to include Firefox"
}
```
All fields are optional — only send what you want to change. Valid fields: `title`, `description`, `status`, `position`.

**Delete a card:**
```bash
DELETE /api/kanban/{id}
```
Response:
```json
{ "ok": true }
```

### Error Responses

| Status | Meaning | Example body |
|--------|---------|-------------|
| `400` | Validation error | `{ "error": "Titlul este obligatoriu" }` |
| `401` | Not authenticated | `{ "error": "Neautorizat" }` |
| `404` | Card not found | `{ "error": "Card negasit" }` |
| `500` | Server error | `{ "error": "..." }` |

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

**kanban_cards** table:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | Required |
| description | text | Optional |
| status | text | `todo`, `in_progress`, or `done` |
| position | integer | Sort order within column |
| card_number | serial | Auto-incrementing visible ID |
| created_by | uuid | FK to auth.users |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

**conversations**, **conversation_participants**, **messages** — direct messaging between users.

RLS policies: authenticated users can read all profiles; users can only insert/update their own profile and posts. Kanban cards are shared — all authenticated users can read/update/delete.

## License

TBD
