# Lumina

A Wattpad-style literary platform where readers discover, upload, and discuss books. Rebranded from "Bookshelf" to **Lumina** with a dark cinematic theme, Spanish-first UI, personalized feeds, and 17-language support.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080 → exposed at `/api`)
- `pnpm --filter @workspace/bookshelf run dev` — run the React frontend (exposed at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm tsx scripts/import-gutenberg.ts [--limit 50] [--pages 3]` — import Spanish books from Gutenberg
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, shadcn/ui, Wouter router, TanStack Query
- Auth: Clerk (via `@clerk/react` on frontend, `@clerk/express` on backend)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Storage: Replit Object Storage (presigned URL upload flow)
- Build: esbuild (CJS bundle)
- i18n: i18next + react-i18next, 17 languages, Spanish default (`lumina-lang` in localStorage)
- Theme: dark mode default (`lumina-theme` in localStorage), toggled via sun/moon button in navbar

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/db/src/schema/` — Drizzle schema: users (+ genrePreferences), books, library, comments, messages
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers (users, books, library, comments, messages, storage, proxy)
- `artifacts/api-server/src/routes/proxy.ts` — File proxy: `GET /api/proxy/file?url=` streams external files
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk FAPI proxy
- `artifacts/bookshelf/src/pages/` — All frontend pages (+ feed.tsx)
- `artifacts/bookshelf/src/components/layout.tsx` — Navbar + Layout wrapper (Lumina brand + dark toggle)
- `artifacts/bookshelf/src/components/genre-quiz.tsx` — Onboarding genre preference modal
- `artifacts/bookshelf/src/i18n/` — i18next setup + 17 locale files
- `scripts/import-gutenberg.ts` — Gutenberg Spanish book importer

## Architecture decisions

- Contract-first API: OpenAPI spec is the single source of truth; all types and hooks are generated from it
- Book file uploads use a two-step presigned URL flow: frontend requests a URL, then PUTs directly to object storage — no file bytes touch the API server
- Clerk authentication is proxied through `/api/__clerk` to support custom domains without CNAME DNS configuration
- DB tables reference Clerk user IDs (`clerk_id`) rather than internal user IDs for auth
- Comments can be deleted by either the comment author or the book author (moderation)
- External book file URLs (Gutenberg etc.) are streamed through `/api/proxy/file?url=` to avoid CORS issues
- `genrePreferences` stored as JSON string in `users.genre_preferences` column, returned as array in API

## Product

- **Home**: Dark cinematic landing page with Spanish CTAs, stats, features, quotes
- **Browse**: Public book catalog (Books tab + People tab with user search)
- **Feed**: Personalized book carousels based on genre preferences + trending section
- **Upload**: Upload PDF or EPUB books with optional cover image, description, genre, and public/private visibility
- **Book Detail**: Full book page with download, library save, and discussion comments
- **Book Reader**: Fixed PDF reader using `<object>` tag; EPUB reader; external URLs proxied automatically
- **Library**: Personal saved books collection
- **Profile**: Public user profile with uploaded books and DM button
- **My Profile**: Edit display name, bio, and avatar
- **Messages**: Direct message conversations between users
- **Auth**: Clerk-powered sign-in/sign-up with Lumina branding
- **Genre Quiz**: Onboarding modal shown on first login to set reading preferences
- **Dark Mode**: Default dark theme (#121826 bg, #FFB800 accent); toggle in navbar saves to localStorage

## User preferences

- Default language: Spanish (`es`) with fallback chain through all 17 supported languages
- Default theme: dark mode

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` before using new hooks
- The `lib/api-zod/src/index.ts` must only contain `export * from "./generated/api";` — the codegen script overwrites it to prevent duplicate exports
- DB tables are named `users`, `books`, `library`, `comments`, `messages` — run `pnpm --filter @workspace/db run push` after schema changes in dev
- Object storage file paths use `objectPath` from the presigned URL response; serve them at `/api/storage/objects{objectPath}`
- The Clerk proxy only activates in production (dev instances connect directly to Clerk servers)
- Genre preferences are stored as a JSON string in the DB column; the API serializes/deserializes automatically
- The genre quiz is shown once per browser session (controlled by `lumina-quiz-done` in localStorage)

## Supported Languages (17)

English, Español (default), Português, Français, Deutsch, Italiano, Nederlands, Svenska, Polski, Русский, Türkçe, العربية, हिन्दी, 日本語, 한국어, 中文(简体), 中文(繁體)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Gutenberg importer uses `system_gutenberg` clerkId and `gutenberg_library` username for the system user
