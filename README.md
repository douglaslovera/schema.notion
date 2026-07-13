# schema.notion

schema.notion is an AI-assisted workspace designer for Notion. Describe a workflow in natural language, refine it through a conversation, and inspect the resulting Notion databases, properties, relations, rollups, and formulas as an interactive diagram.

The application is currently presented in Spanish, while this document covers the project setup and architecture in English.

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
- Choose between Groq, Gemini, and Ollama as the AI provider.

## Tech stack

- Next.js 16 with the App Router and React 19
- TypeScript
- Tailwind CSS 4
- React Flow and Dagre
- Better Auth
- PostgreSQL, Drizzle ORM, and Drizzle Kit
- Vercel AI SDK with Groq, plus Gemini and Ollama adapters
- Zustand
- Biome
- pnpm

## Requirements

- Node.js 20 or newer
- pnpm
- PostgreSQL 16, or Docker for the included local database
- Credentials for the selected AI provider
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
| `BETTER_AUTH_SECRET` | Yes | Secret used to sign and encrypt authentication data. Generate a long random value for each environment. |
| `BETTER_AUTH_URL` | Yes | Canonical application URL, such as `http://localhost:3000`. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No | Client-side auth base URL. It can be omitted for same-origin requests. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `NOTION_CLIENT_ID` | No | Reserved for the optional Notion OAuth provider and future Notion integrations. |
| `NOTION_CLIENT_SECRET` | No | Secret for the optional Notion OAuth provider. |

`AUTH_SECRET` is accepted as a fallback for `BETTER_AUTH_SECRET`.

### AI provider

`AI_PROVIDER` accepts `groq`, `gemini`, or `ollama`. If omitted, the application uses Groq.

| Provider | Variables |
| --- | --- |
| Groq | `GROQ_API_KEY` is required. `GROQ_BASE_URL`, `GROQ_MAIN_MODEL`, and `GROQ_MISC_MODEL` are optional. The default model is `llama-3.3-70b-versatile`. |
| Gemini | Set `AI_PROVIDER=gemini` and provide `GEMINI_API_KEY`. The current adapter uses `gemini-flash-latest`. |
| Ollama | Set `AI_PROVIDER=ollama`. `OLLAMA_BASE_URL` defaults to `http://localhost:11434`, and `OLLAMA_MODEL` defaults to `llama3.1`. |

## Access allowlist

Authentication alone does not grant access to the schema editor. After a user authenticates, their email must also exist in the `access_allowlist` table. Email matching is case-insensitive.

You can manage the table with Drizzle Studio:

```bash
pnpm db:studio
```

Add an entry with the same email used for Google or email/password authentication. Users who are not allowlisted are redirected to the landing-page waitlist.

The current UI supports signing in with email and password but does not expose an email registration screen. Google OAuth creates the normal first-time sign-in path.

## Available scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server with Turbopack. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Run the production server. |
| `pnpm lint` | Lint `src` with Biome. |
| `pnpm lint:fix` | Apply Biome lint fixes to `src`. |
| `pnpm db:generate` | Generate a migration from the Drizzle schema. |
| `pnpm db:migrate` | Apply committed migrations. |
| `pnpm db:push` | Push the current schema directly to the database. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Main routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Product landing page and waitlist. |
| `/sign-in` | Public | Email/password and Google sign-in. |
| `/schemas` | Authenticated and allowlisted | Start a workspace or reopen saved chats. |
| `/schema/:id` | Authenticated, allowlisted, and owner-only | Chat and interactive schema canvas. |
| `/share/:token` | Public when sharing is enabled | Read-only shared canvas. |
| `/embed/:token` | Public when sharing is enabled | Read-only canvas intended for iframe embedding. |

Public sharing exposes only the generated canvas. It does not expose the conversation and does not allow editing.

## Project structure

```text
src/app/                 Next.js routes and application screens
src/components/          Chat, diagram, navigation, sharing, and UI components
src/db/                  Drizzle client and PostgreSQL schema
src/lib/ai/              AI provider interface and provider adapters
src/lib/prompts/         Intent validation and Notion schema prompts
src/lib/thread.ts        Thread persistence, ownership, and sharing actions
src/stores/              Client-side chat and UI state
drizzle/                 Committed SQL migrations
```

Generated schemas follow the JSON model in `src/types/notion-schema.ts`. They describe a workspace containing databases and Notion property types, with explicit metadata for relations and rollups.

## Verification

Before opening a pull request, run:

```bash
pnpm lint
pnpm build
```
