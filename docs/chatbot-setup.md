# Stitch chat setup

Chat is anonymous. Chat history and shared rate limits use Cloudflare D1 through the `DB` Worker binding in `wrangler.jsonc`. The server accesses it through `src/lib/d1.ts`.

## Configure and migrate D1

1. Create a D1 database in the Cloudflare dashboard, or run `npx wrangler d1 create stitch-chat`.
2. Set the database's ID and name in the `DB` entry in `wrangler.jsonc`; keep `migrations_dir` set to `migrations`.
3. Apply migrations to the local development database with `npx wrangler d1 migrations apply DB --local`.
4. Apply migrations to the configured Cloudflare database with `npx wrangler d1 migrations apply DB --remote`.
5. Check migration status with `npx wrangler d1 migrations list DB --local` or `npx wrangler d1 migrations list DB --remote`.

Local D1 data is separate from the remote Cloudflare database. Local development uses the local database unless the binding is explicitly configured as remote. No D1 API token is required for application queries through the Worker binding.

Add the Cloudflare account ID and Workers AI key to `.env.local` if using Workers AI:

   ```env
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   WORKERSAPI_KEY=your-workers-ai-token
   GEMINI_API_KEY=your-google-ai-studio-key
   ```

Keep credentials server-side. Do not add `NEXT_PUBLIC_` or commit `.env.local`. Restart the dev server after changing environment variables.

## Anonymous chat data

The first chat API request issues a random UUID in the HttpOnly `stitch-chat-session` cookie. The cookie is Secure in production, uses SameSite=Lax, and expires after one year. The browser does not need to read or store the ID in localStorage.

The migrations create `stitch_chat_conversations`, `stitch_chat_messages`, and `chat_rate_limits` tables with indexes for session history, message pagination, client-message idempotency, reply idempotency, and rate-limit expiry. The `stitch_chat_` prefix keeps this anonymous chat schema separate from any existing account-based `conversations` and `messages` tables. Existing records are left untouched. New chat IDs are UUIDs.

The sidebar tells visitors that chats are saved on this device and provides “Clear my chats”. Clearing deletes that session's conversations and their messages. Clearing browser cookies also loses the anonymous session link to its saved chats.

## Abuse limits

Message text is capped at 8,000 characters and supplied context at 30,000 characters. Sending and regenerating are rate limited to 20 requests per anonymous session and 80 per source IP per 10-minute window. Hashed IP/session counters live in D1.

## AI and other data

The API tries Gemini streaming first and uses Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) if Gemini is unavailable. Set `GEMINI_API_KEY` to enable Gemini; set the Cloudflare account ID and `WORKERSAPI_KEY` (or `CLOUDFLARE_API_TOKEN`) to enable Workers AI. D1 requires a database ID and a token with D1 permissions. Provider usage may be billed by Google or Cloudflare. Course and lecture-note features continue to use the app's existing local SQLite database.
