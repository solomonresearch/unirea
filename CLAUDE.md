# Engineering Standards — Unirea

**These are non-negotiable. Every contributor, human or AI, follows this workflow.**

---

## Project Context

- **Stack**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase
- **Icons**: lucide-react — always use Lucide, never install other icon libraries
- **Language**: All UI text is in **Romanian**
- **Routes**: Romanian slugs — `/autentificare` (login), `/inregistrare` (signup), `/bun-venit` (welcome), `/onboarding`, `/tabla` (whiteboard), `/avizier` (notice board), `/ziar` (newspaper — public), `/cercuri` (circles), `/mesaje` (messages), `/cauta` (search + map, list/map toggle), `/carusel` (nostalgia photo carousel), `/kanban`, `/profil`, `/setari`, `/admin` (admin panel — admin only). `/harta` redirects to `/cauta`.
- **Supabase**: Auth for sessions, `profiles` table for user data, `posts`/`post_votes`/`comments` for whiteboard, `kanban_cards` for Kanban board, `ziar_posts` for Ziar (newspaper), `carusel_posts`/`carusel_likes`/`carusel_comments` for Carusel (photo sharing), `conversations`/`messages` for DMs, RLS enabled
- **Roles**: `profiles.role` column — `'admin'` | `'moderator'` | `'user'` (default: `'user'`). Admin check is done in API routes and page-level guards, not middleware.
- **Client pattern**: `lib/supabase.ts` for browser, `lib/supabase-server.ts` for server components and API routes
- **API routes**: `app/api/kanban/` — server-side CRUD for kanban cards. Uses `createServerSupabaseClient()` for auth. All routes return 401 if not logged in.
  - `GET /api/kanban` → returns `[{ id, title, description, status, position, card_number, created_by, creator_name, created_at, updated_at }]`
  - `POST /api/kanban` → body: `{ title (required), description, status: "todo"|"in_progress"|"done" }` → returns created card (201)
  - `PATCH /api/kanban/[id]` → body: any of `{ title, description, status, position }` → returns updated card
  - `DELETE /api/kanban/[id]` → returns `{ ok: true }`
- **API routes**: `app/api/ziar/` — public CRUD for ziar (newspaper) posts. Anonymous and authenticated access. Rate limit: 1 post/week per user or IP.
  - `GET /api/ziar` → query: `?category=&county=` → returns `{ posts: [...], canPost: boolean }`
  - `POST /api/ziar` → body: `{ title (required, max 200), body (required, max 2000), category: "stiri"|"anunt"|"apel"|"vand"|"cumpar", links?: string[] (max 5), city?, county?, country? }` → returns created post (201) or 429 if rate limited
  - `DELETE /api/ziar/[id]` → authenticated only, own posts only, soft delete → returns `{ ok: true }`
- **API routes**: `app/api/avizier/` — server-side CRUD for avizier (notice board). Authenticated only. Scoped to user's `highschool`.
  - `GET /api/avizier` → returns `{ announcements: [{ id, content, created_at, expires_at, user_id, profiles, upvotes, downvotes, user_vote, comments }] }`
  - `POST /api/avizier` → body: `{ content (required), expiry_days: 3|7|14 }` → returns created announcement (201)
  - `DELETE /api/avizier/[id]` → soft delete, own announcements only → returns `{ ok: true }`
  - `POST /api/avizier/[id]/vote` → body: `{ vote: 1|-1|0 }` → toggles/removes vote → returns `{ ok: true }`
  - `POST /api/avizier/[id]/comment` → body: `{ content }` → returns created comment (201)
  - `DELETE /api/avizier/[id]/comment/[commentId]` → soft delete, own comments only → returns `{ ok: true }`
- **API routes**: `app/api/tabla/` — server-side CRUD for tabla (whiteboard). Authenticated only. Scoped to classmates (same `highschool` + `graduation_year` + `class`).
  - `GET /api/tabla` → returns `{ posts: [{ id, content, created_at, user_id, profiles, upvotes, downvotes, user_vote, comments }] }`
  - `POST /api/tabla` → body: `{ content (required) }` → returns created post (201)
  - `DELETE /api/tabla/[id]` → soft delete, own posts only → returns `{ ok: true }`
  - `POST /api/tabla/[id]/vote` → body: `{ vote: 1|-1|0 }` → toggles/removes vote → returns `{ ok: true }`
  - `POST /api/tabla/[id]/comment` → body: `{ content }` → returns created comment (201)
  - `DELETE /api/tabla/[id]/comment/[commentId]` → soft delete, own comments only → returns `{ ok: true }`
- **API routes**: `app/api/admin/users/` — admin-only user management. Requires caller's `profile.role = 'admin'`.
  - `GET /api/admin/users` → returns `{ users: [{ id, name, username, email, role, created_at }] }`
  - `PATCH /api/admin/users` → body: `{ userId, role: 'admin'|'moderator'|'user' }` → updates user role, prevents self-demotion → returns `{ ok: true }`
- **API routes**: `app/api/carusel/` — server-side CRUD for carusel (photo sharing). Authenticated only. Photos stored in Supabase Storage (`carusel` bucket, public).
  - `GET /api/carusel` → returns `{ posts: [{ id, caption, image_url, user_id, profiles, likes, liked, comments, created_at }] }`
  - `POST /api/carusel` → multipart/form-data: `file` (required, image/jpeg|png|webp, max 4MB), `caption` (optional, max 500) → returns created post (201)
  - `GET /api/carusel/[id]` → returns single post `{ id, caption, image_url, user_id, profiles, likes, liked, comments, created_at }` or 404
  - `DELETE /api/carusel/[id]` → soft delete + storage cleanup, own posts only → returns `{ ok: true }`
  - `POST /api/carusel/[id]/like` → toggle like → returns `{ ok: true, liked: boolean }`
  - `POST /api/carusel/[id]/comment` → body: `{ content }` (max 500) → returns created comment (201)
  - `DELETE /api/carusel/[id]/comment/[commentId]` → soft delete, own comments only → returns `{ ok: true }`
- **Carusel**: Photo sharing at `/carusel`. Individual posts at `/carusel/[id]` (shareable). Images stored in Supabase Storage (`carusel` bucket, public). `carusel_posts.storage_path` holds the path within the bucket. Public URLs served directly from Supabase Storage — no proxy needed.
- **Ziar**: Public newspaper/bulletin board at `/ziar`. Posts expire after 3 days. Categories: stiri, anunt, apel, vand, cumpar. Anonymous users can read and post. `/avizier/ziar` redirects to `/ziar`. Shared `AvizierTabBar` component used by both `/ziar` and `/avizier` layouts.
- **Middleware**: `middleware.ts` protects authenticated routes (`/tabla`, `/avizier`, `/cercuri`, `/mesaje`, `/cauta`, `/carusel`, `/harta`, `/kanban`, `/profil`, `/setari`, `/admin`) and redirects authenticated users from auth pages
- **Bottom nav**: 6 tabs — Avizier, Cercuri, Mesaje, Cauta, Carusel, Setari
- **Kanban**: Drag-and-drop board using `@dnd-kit`. Components in `components/kanban/`. Realtime sync via Supabase channels. Cards have auto-incrementing `card_number` displayed as `#N`.
- **Design**: Mobile-first. All layouts use `max-w-sm` centered with `px-6` padding. Kanban uses `max-w-6xl` (needs width for columns).
- **Environment**: `.env` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## The Golden Rule

**Nothing ships without a commit. Nothing commits without a test. Nothing tests without a plan.**

Every feature, fix, or refactor follows one cycle: **Plan → Implement → Test → Commit → Push.** No exceptions. No "I'll commit later." No batching 14 changes into one mega-commit on Friday afternoon.

---

## Development Workflow

### 1. Branch First

Never work on `master` directly. Every piece of work gets a branch.

```bash
git checkout -b feat/short-description   # new feature
git checkout -b fix/short-description    # bug fix
git checkout -b refactor/short-description  # refactoring
git checkout -b docs/short-description   # documentation
```

Branch names are lowercase, hyphen-separated, prefixed by type. Keep them short and descriptive. `feat/user-auth` — good. `feat/implementing-the-new-authentication-system-v2-final` — no.

### 2. Small, Atomic Commits

Each commit represents **one logical change**. If you can't describe it in one sentence, it's too big. Break it down.

```
feat: add login endpoint with JWT validation
fix: handle null pointer in payment processing
refactor: extract email service from user controller
test: add coverage for edge cases in rate limiter
docs: update API reference for v2 endpoints
```

Commit message format:
```
<type>: <imperative description in lowercase>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`

The subject line stays under 72 characters. If you need more context, add a body after a blank line. The body explains **why**, not what — the diff shows what.

### 3. Test Before You Commit

No commit goes in without verification. The level of verification scales with the change:

- **Trivial** (typos, comments): Visual inspection is fine.
- **Logic changes**: Run the relevant test suite. All tests pass. No exceptions.
- **New features**: Write tests first or alongside. Minimum: happy path + one failure case.
- **Bug fixes**: Write a test that reproduces the bug BEFORE fixing it. The test fails, you fix the code, the test passes. That's the commit.

```bash
# Run tests before every commit
npm test          # or pytest, cargo test, go test — whatever the stack uses
```

If tests don't exist yet for the area you're touching, that's a smell. Write them. Don't add to the debt.

### 4. Commit and Push After Every Implementation

**Every completed unit of work gets committed and pushed immediately.** Not at the end of the day. Not when you "feel like it." After each implementation:

```bash
git add <specific-files>       # Stage only what belongs to this change
git commit -m "feat: add the thing"
git push origin feat/your-branch
```

**Never use `git add .` or `git add -A` blindly.** Review what you're staging. Know what's going in. Secrets, env files, build artifacts — none of that belongs in the repo.

### 5. Pull Requests

When the feature branch is complete:

1. Rebase on latest `master` to keep history clean
2. Open a PR with a clear title and description
3. PR description must include: what changed, why, and how to test it
4. All CI checks must pass before merge
5. Squash-merge to `master` for a clean history

---

## Code Quality Standards

### Write Code That Doesn't Need Comments

If your code needs a comment to explain what it does, rewrite the code. Comments explain **why** — unusual business rules, non-obvious constraints, regulatory requirements. Never comment the obvious.

### Keep It Simple

The best code is the code you didn't write. Before adding a new dependency, abstraction, or pattern — ask: is this actually necessary right now? Not "might be useful someday." Right now.

- No premature abstractions
- No speculative generality
- No framework-of-the-week churn
- Three lines of similar code is better than a premature helper function

### Error Handling

Handle errors at system boundaries. Trust internal code. Don't wrap every function call in try-catch paranoia. When you do handle errors, handle them properly — log them with context, surface them to the user meaningfully, and fail fast when recovery isn't possible.

### Security Is Not Optional

- Validate all external input
- No secrets in code, ever — use environment variables
- Dependencies get audited before adoption
- Keep dependencies updated — known vulnerabilities are unacceptable
- `.env` files are in `.gitignore`. Always. Check twice.

---

## Git Hygiene

### What Goes in the Repo

- Source code
- Configuration templates (`.env.example`, not `.env`)
- Documentation
- Test files
- CI/CD configuration

### What Never Goes in the Repo

- `.env` files with real credentials
- `node_modules/`, `__pycache__/`, build output
- IDE-specific files (`.idea/`, `.vscode/settings.json` with personal prefs)
- Large binary files
- Anything generated that can be regenerated from source

### .gitignore Is Set Up First

Before the first real commit, `.gitignore` is configured. Not after you've already committed `node_modules`. Before.

---

## The Commit Cadence

Here's what a healthy development session looks like:

```
1. Pull latest master
2. Create feature branch
3. Implement first small piece
4. Test it
5. Commit with clear message
6. Push to remote
7. Implement next piece
8. Test it
9. Commit with clear message
10. Push to remote
11. ... repeat until feature complete
12. Open PR
13. Review, address feedback
14. Merge to master
```

You should have **multiple commits per feature**, not one giant commit. Each push acts as a checkpoint — if your laptop catches fire, your work survives.

---

## For AI-Assisted Development

When working with Claude or any AI tool:

- **Read before you write.** Always read existing code before modifying it. Understand the patterns already in place.
- **Don't over-engineer.** Solve the problem that exists, not the problem that might exist.
- **Commit after each implementation step.** Don't accumulate a massive diff. Small, reviewable, atomic commits.
- **Run tests after every change.** If something breaks, the last commit is the culprit. Small commits make this trivial.
- **Never commit secrets or credentials.** Check staged files before every commit.

---

## Summary

| Step | Action | Command |
|------|--------|---------|
| 1 | Branch from master | `git checkout -b feat/name` |
| 2 | Implement one thing | Write the code |
| 3 | Test it | `npm test` / relevant test command |
| 4 | Stage specific files | `git add <files>` |
| 5 | Commit with clear message | `git commit -m "feat: description"` |
| 6 | Push immediately | `git push origin feat/name` |
| 7 | Repeat 2-6 | Until feature complete |
| 8 | Open PR | `gh pr create` |
| 9 | Merge to master | After review + CI passes |

**Ship small. Ship often. Ship tested. No shortcuts.**
