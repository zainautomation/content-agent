# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note:** Read `node_modules/next/dist/docs/` before writing Next.js code — this project uses Next.js 16, which has breaking changes from earlier versions.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # prisma generate + next build
npm run lint         # ESLint
npx prisma migrate dev --name <name>   # Create and apply a DB migration
npx prisma studio    # Browse the database
npx prisma generate  # Regenerate Prisma client after schema changes
```

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=                  # PostgreSQL connection string (pooled)
DIRECT_URL=                    # PostgreSQL direct connection (for Prisma migrations)
NEXTAUTH_SECRET=               # Random secret for JWT signing
NEXTAUTH_URL=                  # Base URL e.g. http://localhost:3000
ANTHROPIC_API_KEY=             # Claude API key
SUPABASE_URL=                  # Supabase project URL (brand asset storage)
SUPABASE_SERVICE_ROLE_KEY=     # Supabase service role key (brand asset storage)
LINKEDIN_CLIENT_ID=            # LinkedIn OAuth app client ID
LINKEDIN_CLIENT_SECRET=        # LinkedIn OAuth app client secret
```

---

## Frontend Pages (URL → File)

| URL | File | Notes |
|-----|------|-------|
| `/` | [src/app/page.tsx](src/app/page.tsx) | Redirects to `/create` |
| `/setup` | [src/app/setup/page.tsx](src/app/setup/page.tsx) | First-run admin account creation; redirects to `/login` if users already exist |
| `/login` | [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx) | Credentials sign-in via NextAuth |
| `/invite/[token]` | [src/app/(auth)/invite/[token]/page.tsx](src/app/(auth)/invite/[token]/page.tsx) | Invite redemption — creates a USER account from an admin-generated token |
| `/create` | [src/app/(dashboard)/create/page.tsx](src/app/(dashboard)/create/page.tsx) | Main content creation page (social posts, comments, DMs, emails, lead magnets, content plans, batch content) |
| `/posts` | [src/app/(dashboard)/posts/page.tsx](src/app/(dashboard)/posts/page.tsx) | Post library — list of all workspace posts with status badges |
| `/posts/[id]` | [src/app/(dashboard)/posts/[id]/page.tsx](src/app/(dashboard)/posts/[id]/page.tsx) | Single post detail — edit content, review/approve/reject, schedule, publish |
| `/calendar` | [src/app/(dashboard)/calendar/page.tsx](src/app/(dashboard)/calendar/page.tsx) | Scheduled posts view — sorted list of upcoming scheduled items |
| `/settings/prompts` | [src/app/(dashboard)/settings/prompts/page.tsx](src/app/(dashboard)/settings/prompts/page.tsx) | Brand voice + per-prompt editor (Master Brand, LinkedIn Posts, Comments, Cold Outreach, Content Pillars, Image Post) |
| `/settings/integrations` | [src/app/(dashboard)/settings/integrations/page.tsx](src/app/(dashboard)/settings/integrations/page.tsx) | Platform connection settings (LinkedIn, Facebook, Instagram, WordPress, Canva) |
| `/settings/assets` | [src/app/(dashboard)/settings/assets/page.tsx](src/app/(dashboard)/settings/assets/page.tsx) | Brand asset management — upload/delete author photo, company logo, and tool logos stored in Supabase |
| `/admin` | [src/app/admin/page.tsx](src/app/admin/page.tsx) | Admin panel — user management, invite generation, permissions toggles, password reset |

### Layouts

| Scope | File | Wraps |
|-------|------|-------|
| Root | [src/app/layout.tsx](src/app/layout.tsx) | All pages — sets up `SessionProvider`, `ThemeProvider` |
| Auth pages | [src/app/(auth)/layout.tsx](src/app/(auth)/layout.tsx) | `/login`, `/invite/[token]` |
| Dashboard | [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx) | All `/create`, `/posts`, `/calendar`, `/settings/*` — renders `Sidebar` + `WorkspaceLoader` |
| Admin | [src/app/admin/layout.tsx](src/app/admin/layout.tsx) | `/admin` only |

---

## API Routes (Endpoint → File)

### Posts

| Endpoint | Method | File | What it does |
|----------|--------|------|--------------|
| `/api/posts` | GET | [src/app/api/posts/[[...slug]]/route.ts](src/app/api/posts/[[...slug]]/route.ts) | List all posts for the workspace |
| `/api/posts/[id]` | GET | same | Single post |
| `/api/posts` | POST | same | Create post |
| `/api/posts/[id]` | PATCH | same | Update post content / brief |
| `/api/posts/[id]/status` | PATCH | same | Update post status + review comment |
| `/api/posts/[id]/schedule` | POST | same | Create a `ScheduledPost` record |
| `/api/posts/[id]/schedule` | DELETE | same | Remove the scheduled record |
| `/api/posts/[id]/publish` | POST | same | Trigger platform publish (delegates to integrations) |
| `/api/posts/[id]` | DELETE | same | Delete post |

### AI Generation

| Endpoint | Method | File | What it does |
|----------|--------|------|--------------|
| `/api/generate` (mode: `social`) | POST | [src/app/api/generate/route.ts](src/app/api/generate/route.ts) | Run optimizer → generator pipeline, returns `brief` + `platformPosts` |
| `/api/generate` (mode: `prompt`) | POST | same | Conversational prompt-mode generation (comments, DMs, emails, etc.) |
| `/api/generate` (mode: `image-data`) | POST | same | Extract structured JSON for the image card template |
| `/api/review` | POST | [src/app/api/review/route.ts](src/app/api/review/route.ts) | Regenerate a single platform post with reviewer feedback |

### Image Generation

| Endpoint | Method | File | What it does |
|----------|--------|------|--------------|
| `/api/image` | POST | [src/app/api/image/route.tsx](src/app/api/image/route.tsx) | Server-side: Satori + resvg renders React → SVG → 1080×1080 PNG; used by LinkedIn direct publish |
| `/api/image` | GET | same | Returns paths for author photo, company logo, and tool logo names from Supabase |
| `/api/assets` | POST | [src/app/api/assets/route.ts](src/app/api/assets/route.ts) | Upload brand asset (author-photo, company-logo, tool-logo) to Supabase Storage |
| `/api/assets` | DELETE | same | Delete a brand asset from Supabase Storage |
| `/api/linkedin/publish` | POST | [src/app/api/linkedin/publish/route.ts](src/app/api/linkedin/publish/route.ts) | Generate image server-side + upload to LinkedIn CDN + publish post |

### Workspace

| Endpoint | Method | File | What it does |
|----------|--------|------|--------------|
| `/api/workspace` | GET | [src/app/api/workspace/[[...slug]]/route.ts](src/app/api/workspace/[[...slug]]/route.ts) | Brand settings + connections + scheduled posts |
| `/api/workspace/settings` | GET | same | Brand settings + permissions only |
| `/api/workspace/settings` | PATCH | same | Save brand settings / prompts |
| `/api/workspace/connections` | GET | same | Platform connections array |
| `/api/workspace/connections` | PATCH | same | Update a single platform connection |

### Admin

| Endpoint | Method | File | What it does |
|----------|--------|------|--------------|
| `/api/admin/users` | GET | [src/app/api/admin/[[...slug]]/route.ts](src/app/api/admin/[[...slug]]/route.ts) | List all users with their permissions |
| `/api/admin/users/[id]` | GET | same | Single user + their workspace permissions |
| `/api/admin/users/[id]/permissions` | PATCH | same | Update workspace permissions for a user |
| `/api/admin/users/[id]/password` | PATCH | same | Reset a user's password |
| `/api/admin/users/register` | PUT | same | Create a user directly (no invite needed) |
| `/api/admin/users/[id]` | DELETE | same | Delete user + their workspace |
| `/api/admin/invite` | GET | same | List admin's sent invites |
| `/api/admin/invite` | POST | same | Create a new invite token (7-day expiry) |

### Auth & Onboarding

| Endpoint | Method | File | What it does |
|----------|--------|------|--------------|
| `/api/auth/[...nextauth]` | GET/POST | [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/[...nextauth]/route.ts) | NextAuth handler |
| `/api/auth/linkedin` | GET | [src/app/api/auth/linkedin/route.ts](src/app/api/auth/linkedin/route.ts) | Start LinkedIn OAuth — redirects to LinkedIn with `workspaceId` as state |
| `/api/auth/linkedin/callback` | GET | [src/app/api/auth/linkedin/callback/route.ts](src/app/api/auth/linkedin/callback/route.ts) | LinkedIn OAuth callback — exchanges code for token, saves to workspace connections |
| `/api/setup` | GET | [src/app/api/setup/route.ts](src/app/api/setup/route.ts) | Returns `{ hasUsers }` — used by `/setup` page to self-redirect |
| `/api/setup` | POST | same | Creates first ADMIN user + workspace (blocked if users exist) |
| `/api/invite/[token]` | GET | [src/app/api/invite/[token]/route.ts](src/app/api/invite/[token]/route.ts) | Validate invite token |
| `/api/invite/[token]` | POST | same | Register new USER from invite |
| `/api/canva` | POST | [src/app/api/canva/route.ts](src/app/api/canva/route.ts) | Create a Canva design via integration |

---

## Key Source Files

| File | Purpose |
|------|---------|
| [src/types/index.ts](src/types/index.ts) | All shared types: `Post`, `PlatformPost`, `ContentBrief`, `BrandSettings`, `Permissions`, `PlatformConnection` |
| [src/lib/auth.ts](src/lib/auth.ts) | NextAuth config — JWT strategy, credentials provider, session callbacks |
| [src/lib/api-auth.ts](src/lib/api-auth.ts) | `getAuthInfo()` — extracts `userId`, `workspaceId`, `role` from JWT for every API route |
| [src/lib/prisma.ts](src/lib/prisma.ts) | Prisma client singleton |
| [src/lib/ai/client.ts](src/lib/ai/client.ts) | `callClaude()` wrapper — model constants (`generation` = Sonnet 4.6, `fast` = Haiku 4.5) |
| [src/lib/ai/optimizer.ts](src/lib/ai/optimizer.ts) | Converts raw input/URL → `ContentBrief` |
| [src/lib/ai/generator.ts](src/lib/ai/generator.ts) | `generatePlatformPost()` — turns a `ContentBrief` into a `PlatformPost` per platform |
| [src/lib/ai/reviewer.ts](src/lib/ai/reviewer.ts) | `regenerateWithFeedback()` — revises a platform post given reviewer feedback |
| [src/lib/prompts/platforms/index.ts](src/lib/prompts/platforms/index.ts) | Per-platform prompt strings used in generation |
| [src/lib/supabase-storage.ts](src/lib/supabase-storage.ts) | Supabase Storage client — upload/delete/list assets in the `brand-assets` bucket |
| [src/store/posts.store.ts](src/store/posts.store.ts) | Zustand store — post list, optimistic CRUD, syncs to `/api/posts` |
| [src/store/settings.store.ts](src/store/settings.store.ts) | Zustand store — brand settings, connections, permissions; holds default Zutomate brand voice |
| [src/store/schedule.store.ts](src/store/schedule.store.ts) | Zustand store — scheduled post records |
| [src/components/WorkspaceLoader.tsx](src/components/WorkspaceLoader.tsx) | Invisible component in dashboard layout — bootstraps all three stores on mount |
| [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) | Left nav: Create Post, My Posts, Calendar, Brand & Prompts, Integrations; shows Admin link for ADMIN role |
| [src/components/PostImageModal.tsx](src/components/PostImageModal.tsx) | Modal for browser-side image generation — uses `html2canvas` to rasterise `PostImageTemplate` |
| [src/components/PostImageTemplate.tsx](src/components/PostImageTemplate.tsx) | React DOM template rendered by `html2canvas` (browser path); also defines `ImageTemplateData` / `ImageTheme` types consumed by the server-side Satori path |
| [src/components/CarouselModal.tsx](src/components/CarouselModal.tsx) | Modal for generating multi-slide carousel posts |
| [src/components/CarouselSlideTemplate.tsx](src/components/CarouselSlideTemplate.tsx) | Individual slide template for carousel posts |
| [src/lib/integrations/canva.ts](src/lib/integrations/canva.ts) | Canva OAuth + design creation |
| [src/lib/integrations/linkedin.ts](src/lib/integrations/linkedin.ts) | LinkedIn publishing |
| [src/lib/integrations/facebook.ts](src/lib/integrations/facebook.ts) | Facebook publishing |
| [src/lib/integrations/instagram.ts](src/lib/integrations/instagram.ts) | Instagram publishing |
| [src/lib/integrations/wordpress.ts](src/lib/integrations/wordpress.ts) | WordPress publishing |

---

## Architecture Notes

### Data Model
- **User** → belongs to one **Workspace** (1:1 via `workspaceId` on User)
- **Workspace** stores `brandSettings`, `connections`, and `permissions` as JSON strings (parsed/serialized at the API layer)
- **Post** stores `brief` and `platformPosts` as JSON strings — always parse via the `serialize()` helper in the posts route
- **ScheduledPost** is a scheduling record separate from Post status; a post's status is set to `scheduled` independently
- **InviteToken** — 7-day expiry, single-use, optionally pre-scoped to an email

### AI Pipeline
Content generation is a two-step pipeline in `src/lib/ai/`:
1. `optimizer.ts` — converts raw input (idea or URL) into a structured `ContentBrief`
2. `generator.ts` — calls `generatePlatformPost` per platform, combining brand settings + platform prompt

Both steps go through `callClaude()` in `client.ts`. Heavy generation uses `claude-sonnet-4-6`; fast/cheap calls (image data extraction) use `claude-haiku-4-5-20251001`.

### Image Generation (Two Paths)
There are two separate image-generation paths for the 1080×1080 social card:

- **Browser path** (`PostImageModal` + `PostImageTemplate`): renders a React DOM component and uses `html2canvas` to capture it as a PNG download. Used for all platforms except direct LinkedIn publish.
- **Server path** (`/api/image`): renders a React component (`src/app/api/image/route.tsx`) with **Satori** (JSX → SVG) then **resvg** (SVG → PNG). Used when publishing directly to LinkedIn so the image can be uploaded to the LinkedIn CDN. Satori has constraints: no SVG `<img>` sources (use raster only), no React hooks in the render tree.

Brand assets (company logo, author photo, tool logos) are fetched from Supabase Storage and embedded as base64 data URIs for both paths.

### Brand Asset Storage
Brand assets live in the Supabase Storage bucket `brand-assets` with two sub-folders:
- `brand/` — `author-photo.<ext>` and `company-logo.<ext>` (one file each; uploading a new one replaces all extension variants)
- `tools/` — one file per tool, named `<kebab-case-tool-name>.<ext>`

`src/lib/supabase-storage.ts` provides `uploadAsset`, `deleteAssets`, `listFolder`, and `fetchAsDataUri`. The `/api/assets` route handles uploads/deletes; `/api/image` (GET) returns the current asset paths.

### LinkedIn OAuth
LinkedIn uses a **custom OAuth flow** separate from NextAuth (NextAuth handles only email/password):
1. `/api/auth/linkedin` redirects to LinkedIn with the `workspaceId` base64-encoded as `state`
2. `/api/auth/linkedin/callback` exchanges the code, stores the access token in `Workspace.connections`

Required env vars: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`. The LinkedIn OAuth scope is `openid profile w_organization_social r_organization_social`.

### Client State Bootstrapping
`WorkspaceLoader` (in dashboard layout) fetches `/api/posts`, `/api/workspace/settings`, and `/api/workspace/connections` in parallel on first mount, then calls `hydrate()` on all three Zustand stores. Stores use optimistic updates — UI updates immediately, then fire-and-forget API calls to persist.

### Permissions
`Workspace.permissions` is a JSON object matching the `Permissions` type. All flags default to `true` (`DEFAULT_PERMISSIONS`). Admins toggle them per-user via the `/admin` panel → `PATCH /api/admin/users/[id]/permissions`.

### Roles
- `ADMIN` — created at `/setup` or via `PUT /api/admin/users/register`; can access `/admin`, manage users, generate invites
- `USER` — created via invite link; scoped entirely to their own workspace
