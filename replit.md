# Bookshelf

A Wattpad-style book sharing platform where readers discover, upload, and discuss books. Users can share PDFs and EPUBs, build personal libraries, comment on books, and message each other.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 → exposed at `/api`)
- `pnpm --filter @workspace/bookshelf run dev` — run the React frontend (exposed at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
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

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/db/src/schema/` — Drizzle schema: users, books, library, comments, messages
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers (users, books, library, comments, messages, storage)
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk FAPI proxy
- `artifacts/bookshelf/src/pages/` — All frontend pages
- `artifacts/bookshelf/src/components/layout.tsx` — Navbar + Layout wrapper

## Architecture decisions

- Contract-first API: OpenAPI spec is the single source of truth; all types and hooks are generated from it
- Book file uploads use a two-step presigned URL flow: frontend requests a URL, then PUTs directly to object storage — no file bytes touch the API server
- Clerk authentication is proxied through `/api/__clerk` to support custom domains without CNAME DNS configuration
- DB tables reference Clerk user IDs (`clerk_id`) rather than internal user IDs for auth
- Comments can be deleted by either the comment author or the book author (moderation)

## Product

- **Browse**: Public book catalog with search and genre filtering
- **Upload**: Upload PDF or EPUB books with optional cover image, description, genre, and public/private visibility
- **Book Detail**: Full book page with download, library save, and discussion comments
- **Library**: Personal saved books collection
- **Profile**: Public user profile with uploaded books and DM button
- **My Profile**: Edit display name, bio, and avatar
- **Messages**: Direct message conversations between users
- **Auth**: Clerk-powered sign-in/sign-up with warm Bookshelf branding

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` before using new hooks
- The `lib/api-zod/src/index.ts` must only contain `export * from "./generated/api";` — the codegen script overwrites it to prevent duplicate exports
- DB tables are named `users`, `books`, `library`, `comments`, `messages` — run `pnpm --filter @workspace/db run push` after schema changes in dev
- Object storage file paths use `objectPath` from the presigned URL response; serve them at `/api/storage/objects{objectPath}`
- The Clerk proxy only activates in production (dev instances connect directly to Clerk servers)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
