# schema.notion

schema.notion is an AI-assisted workspace designer for Notion. Describe a workflow in natural language, refine it through a conversation, and inspect the resulting Notion databases, properties, relations, rollups, and formulas as an interactive diagram.

## Current features

- Generate complete Notion workspace schemas from natural-language descriptions.
- Refine an existing schema through an ongoing chat.
- Visualize databases, properties, and relations on an interactive React Flow canvas.
- Save, reopen, and delete conversations backed by PostgreSQL.
- Reposition diagram nodes and switch between light and dark themes.
- Copy the generated schema as JSON.
- Publish a read-only canvas through a public link or iframe embed.
- Sign in with email and password or Google through Better Auth.
- Restrict application access to emails in a database-backed allowlist.
- Generate schemas through OpenRouter, with model choices managed by process.

## Tech stack

- Next.js 16 with the App Router and React 19
- TypeScript
- Tailwind CSS 4
- React Flow and Dagre
- Better Auth
- PostgreSQL, Drizzle ORM, and Drizzle Kit
- Vercel AI SDK with OpenRouter
- Zustand
- Biome
- pnpm

## Requirements

- Node.js 20 or newer
- pnpm
- PostgreSQL 16, or Docker for the included local database
- An OpenRouter API key
- Google OAuth credentials (the current auth configuration requires them at startup)

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Start the included PostgreSQL service, or provide your own database:

   ```bash
   docker compose up -d postgres
   ```

   The included service listens on port `5433` and matches the default `DATABASE_URL` in `.env.example`.

4. Apply the committed database migrations:

   ```bash
   pnpm db:migrate
   ```

   Migration `0003_secure_thread_storage` backfills JSONB conversations into
   the normalized `messages` table, treats existing timestamp values as UTC,
   and removes the legacy `users` table. It aborts before changing data if it
   finds orphaned thread, session, or account rows, so resolve any reported
   orphan records before retrying. Back up production before applying it.

5. Configure Google OAuth with this local callback URL:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

6. Start the application:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment variables

### Application and authentication

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `DATABASE_MAX_CONNECTIONS` | No | Maximum Postgres.js connections per application instance. Defaults to `5`; coordinate this with any external pool. |
| `DATABASE_IDLE_TIMEOUT_SECONDS` | No | Seconds before an idle database connection is closed. Defaults to `20`. |
| `DATABASE_CONNECT_TIMEOUT_SECONDS` | No | Database connection timeout in seconds. Defaults to `10`. |
| `DATABASE_MAX_LIFETIME_SECONDS` | No | Maximum connection lifetime in seconds. Defaults to `1800`. |
| `BETTER_AUTH_SECRET` | Yes | Secret used to sign and encrypt authentication data. Generate a long random value for each environment. |
| `BETTER_AUTH_URL` | Yes | Canonical application URL, such as `http://localhost:3000`. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No | Client-side auth base URL. It can be omitted for same-origin requests. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `NOTION_CLIENT_ID` | No | Reserved for the optional Notion OAuth provider and future Notion integrations. |
| `NOTION_CLIENT_SECRET` | No | Secret for the optional Notion OAuth provider. |

`AUTH_SECRET` is accepted as a fallback for `BETTER_AUTH_SECRET`.

### AI provider

OpenRouter is the only supported AI provider. Set `OPENROUTER_API_KEY` to an active OpenRouter API key.

Model selection is centralized in `src/lib/ai/models.ts`. Each application process has its own entry so models can be assigned independently as those requirements are defined.

## Access allowlist

Authentication alone does not grant access to the schema editor. After a user authenticates, their email must also exist in the `access_allowlist` table. Email matching is case-insensitive.

You can manage the table with Drizzle Studio:

```bash
pnpm db:studio
```

Add an entry with the same email used for Google or email/password authentication. Users who are not allowlisted are redirected to the landing-page waitlist.

The current UI supports signing in with email and password but does not expose an email registration screen. Google OAuth creates the normal first-time sign-in path.

## MCP server (bring your own AI)

schema.notion exposes a remote MCP server so users can design workspaces with
their own AI subscription (Claude, ChatGPT, Cursor, Codex...) instead of the
app's OpenRouter key. The client's model does the design work; the server only
stores, validates and shares diagrams.

- Endpoint: `<BETTER_AUTH_URL>/api/mcp` (Streamable HTTP, stateless)
- Auth: OAuth 2.1 with dynamic client registration and PKCE (Better Auth `mcp`
  plugin). Users sign in, approve the client on `/oauth/consent`, and the
  access allowlist applies just like in the web app.
- Discovery: `/.well-known/oauth-authorization-server` and
  `/.well-known/oauth-protected-resource`

Run `pnpm db:migrate` after pulling, since the OAuth tables come from
`drizzle/0004_mcp_oauth.sql`.

| Tool | Purpose |
| --- | --- |
| `list_projects` | Projects owned by the user, newest first |
| `get_project` | Diagram JSON, share status and (optionally) chat history |
| `create_project` | New project, optionally with an initial diagram |
| `rename_project` / `duplicate_project` / `delete_project` | Project management |
| `validate_diagram` | Dry-run validation of a diagram |
| `save_diagram` | Replace a project's diagram with complete, validated JSON |
| `share_project` / `unshare_project` | Public read-only link and embed URL |

It also provides the `schema-notion://guides/diagram-format` resource and the
`design_notion_workspace` prompt.

Connect a client, for example Claude Code:

```bash
claude mcp add --transport http schema-notion http://localhost:3000/api/mcp
```

In Claude.ai or ChatGPT, add a custom connector with the same URL. The app must
be reachable from the provider, e.g. through a tunnel.

## Available scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server with Turbopack. |
| `pnpm build` | Create a production build. |
| `pnpm test` | Run the authorization-boundary input regression tests. |
| `pnpm start` | Run the production server. |
| `pnpm lint` | Lint `src` with Biome. |
| `pnpm lint:fix` | Apply Biome lint fixes to `src`. |
| `pnpm db:generate` | Generate a migration from the Drizzle schema. |
| `pnpm db:migrate` | Apply committed migrations. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Main routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Product landing page and waitlist. |
| `/sign-in` | Public | Email/password and Google sign-in. |
| `/schemas` | Authenticated | Compatibility route that redirects to `/schema/new`. |
| `/schema/new` | Authenticated and allowlisted | Open a new chat. |
| `/schema/:id` | Authenticated, allowlisted, and owner-only | Chat and interactive schema canvas. |
| `/share/:token` | Public when sharing is enabled | Read-only shared canvas. |
| `/embed/:token` | Public when sharing is enabled | Read-only canvas intended for iframe embedding. |

Public sharing exposes only the generated canvas. It does not expose the conversation and does not allow editing.

Thread conversations are stored as individual message rows. Thread saves use
an ownership-constrained upsert and merge messages by their per-thread client
ID, preventing stale tabs from deleting messages written by another request.

## Project structure

```text
src/app/                 Next.js routes and application screens
src/components/          Chat, diagram, navigation, sharing, and UI components
src/db/                  Drizzle client and PostgreSQL schema
src/lib/ai/              Authorized OpenRouter actions and model configuration
src/lib/prompts/         Intent validation and Notion schema prompts
src/lib/thread.ts        Server-only thread data access
src/lib/thread-actions.ts Authorized thread mutations callable by clients
src/stores/              Client-side chat and UI state
drizzle/                 Committed SQL migrations
```

Generated schemas follow the JSON model in `src/types/notion-schema.ts`. They describe a workspace containing databases and Notion property types, with explicit metadata for relations and rollups.

## Verification

Before opening a pull request, run:

```bash
pnpm lint
pnpm test
pnpm build
```
