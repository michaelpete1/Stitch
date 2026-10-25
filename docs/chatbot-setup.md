# Stitch chat setup

Chat is anonymous. Chat history and shared rate limits use Cloudflare D1 through Cloudflare's server-side API. Existing Next.js API routes and the current Next.js hosting setup are retained. Course, lecture-note, and account data continue using the existing SQLite/auth flow.

## Create and configure D1

1. Create a D1 database in the Cloudflare dashboard, or run `npx wrangler@latest d1 create stitch-chat`.
2. Apply the schema in `migrations/0001_chat.sql` using the database name from step 1: `npx wrangler@latest d1 execute stitch-chat --remote --file=migrations/0001_chat.sql`.
3. Copy the Cloudflare account ID from the dashboard and the D1 database ID from the database's overview/configuration.
4. Create a Cloudflare API token scoped to that account with **D1 Read** and **D1 Edit** permissions for chat history. Workers AI can use a separate token with **Workers AI Read** permission.
5. Add these values to `.env.local` (copy `.env.example` if needed). The app accepts the existing `WORKERSAPI_KEY` variable for Workers AI:

   ```env
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_D1_DATABASE_ID=your-database-id
   CLOUDFLARE_D1_DATABASE_TOKEN=your-d1-server-side-token
   WORKERSAPI_KEY=your-workers-ai-token
   GEMINI_API_KEY=your-google-ai-studio-key
   ```

6. Keep the token and Gemini key server-side. Do not add `NEXT_PUBLIC_` or commit `.env.local`. Restart the dev server after changing environment variables.

The app talks to D1 using Cloudflare's documented HTTPS query API, so local development and the current Next.js host do not require a Workers adapter or D1 binding. The token must have D1 Read and Write access. [Cloudflare D1 query API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/)

## Anonymous chat data

The first chat API request issues a random UUID in the HttpOnly `stitch-chat-session` cookie. The cookie is Secure in production, uses SameSite=Lax, and expires after one year. The browser does not need to read or store the ID in localStorage.

The migration creates `stitch_chat_conversations`, `stitch_chat_messages`, and `chat_rate_limits` tables with indexes for session history, message pagination, client-message idempotency, reply idempotency, and rate-limit expiry. The `stitch_chat_` prefix keeps this anonymous chat schema separate from any existing account-based `conversations` and `messages` tables. Existing records are left untouched. New chat IDs are UUIDs.

The sidebar tells visitors that chats are saved on this device and provides “Clear my chats”. Clearing deletes that session's conversations and their messages. Clearing browser cookies also loses the anonymous session link to its saved chats.

## Abuse limits

Message text is capped at 8,000 characters and supplied context at 30,000 characters. Sending and regenerating are rate limited to 20 requests per anonymous session and 80 per source IP per 10-minute window. Hashed IP/session counters live in D1.

## AI and other data

The API tries Gemini streaming first and uses Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) if Gemini is unavailable. Set `GEMINI_API_KEY` to enable Gemini; set the Cloudflare account ID and `WORKERSAPI_KEY` (or `CLOUDFLARE_API_TOKEN`) to enable Workers AI. D1 requires a database ID and a token with D1 permissions. Provider usage may be billed by Google or Cloudflare. Course and lecture-note features continue to use the app's existing local SQLite database.
