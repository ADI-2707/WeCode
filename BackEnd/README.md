# WeCode — Backend

This document describes the backend API, the tools and packages used, required environment variables, example requests/responses, and a flow diagram showing how requests flow through middleware into controllers, database, and third-party services (Stream, Inngest, Clerk).

**API Base Path**: `/api` (the example assumes your server mounts routes under `/api` — adjust if different)

**Contents**
- **API Endpoints**: routes, request/response examples.
- **Environment & Tools**: env vars and third-party services used.
- **Packages**: npm packages used in the backend and short purpose.
- **Flow Diagram**: ASCII diagram and explanation of how components connect.

**API Endpoints**

- **Create Session**: `POST /api/sessions/`
	- **Auth**: Protected — requires Clerk auth (via `protectRoute` middleware using `@clerk/express`).
	- **Body** (JSON):
		- `problem` (string) — required
		- `difficulty` (string) — one of `easy`, `medium`, `hard` (required)
	- **Success (201)**: `{ session }` — newly created session document
	- **Error (400/500)**: `{ message }`
	- **cURL Example**:
		```bash
		curl -X POST "http://localhost:3000/api/sessions/" \
			-H "Content-Type: application/json" \
			-H "Authorization: Bearer <CLERK_JWT_OR_SESSION>" \
			-d '{"problem":"Two Sum","difficulty":"easy"}'
		```

- **Get Active Sessions**: `GET /api/sessions/active`
	- **Auth**: Protected
	- **Success (200)**: `{ sessions: [...] }` — array of `Session` documents (populated `host` and `participant` fields)
	- **cURL Example**:
		```bash
		curl -H "Authorization: Bearer <CLERK_JWT>" "http://localhost:3000/api/sessions/active"
		```

- **Get My Recent Sessions**: `GET /api/sessions/my-recent`
	- **Auth**: Protected
	- **Success (200)**: `{ sessions: [...] }` — completed sessions where the user was host or participant

- **Get Session By ID**: `GET /api/sessions/:id`
	- **Auth**: Protected
	- **Success (200)**: `{ session }`
	- **Not found (404)**: `{ message: "Session not found" }`

- **Join Session**: `POST /api/sessions/:id/join`
	- **Auth**: Protected
	- **Behavior**: Adds the authenticated user as `participant` if session is `active` and has no `participant` yet. Also adds the user to the Stream chat channel for that session.
	- **Success (200)**: `{ session }`
	- **Errors**: session not found (400), cannot join completed (400), host cannot join (400), session full (409)

- **End Session**: `POST /api/sessions/:id/end`
	- **Auth**: Protected (the host only)
	- **Behavior**: Deletes Stream video call and chat channel, marks local `Session.status` as `completed`.
	- **Success (200)**: `{ session, message: "Session ended successfully" }`

- **Get Stream Chat Token**: `GET /api/chat/token`
	- **Auth**: Protected
	- **Success (200)**: `{ token, userId, userName, userImage }`
		- The controller uses `chatClient.createToken(req.user.clerkId)` to generate a Stream Chat token for the user (Clerk id is used as Stream user id).
	- **cURL Example**:
		```bash
		curl -H "Authorization: Bearer <CLERK_JWT>" "http://localhost:3000/api/chat/token"
		```

**Request / Response Notes**
- All protected routes use `protectRoute` middleware which is a stack: `requireAuth()` (from `@clerk/express`) followed by a custom function that looks up the `User` by `clerkId` and attaches it to `req.user`.
- Controllers use `req.user._id` and `req.user.clerkId` to interact with MongoDB and Stream.

**Environment Variables**
Set these in your `.env` (or environment). They are referenced in `src/lib/env.js`.

- `PORT` — server port (e.g. `3000`)
- `DB_URL` — MongoDB connection string
- `NODE_ENV` — `development` or `production`
- `CLIENT_URL` — front-end origin (CORS)
- `INNGEST_EVENT_KEY` — key to validate incoming Inngest events (if used)
- `INNGEST_SIGNING_KEY` — Inngest signing key
- `STREAM_API_KEY` — Stream API key
- `STREAM_API_SECRET` — Stream API secret

Additionally, Clerk requires setup (Clerk keys/config) — follow Clerk docs to configure authentication middleware and tokens. The project uses `@clerk/express` and `requireAuth()`.

**Packages / Tools (Backend)**
The `BackEnd/package.json` lists the following packages. Purpose summaries included.

- **@clerk/express**: Authentication middleware and helpers (protect routes).
- **express**: Web framework for routes and controllers.
- **mongoose**: MongoDB ORM (models `User`, `Session`).
- **dotenv**: Loads `.env` into `process.env` (see `src/lib/env.js`).
- **inngest**: Background functions / event handlers (see `src/lib/inngest.js` for syncing Clerk user events into the DB and Stream user upsert).
- **stream-chat**: Stream Chat client used for chat features.
- **@stream-io/node-sdk**: StreamIO SDK used for video call management (`streamClient.video.call(...)`).
- **cors**: Cross-origin resource sharing middleware.
- **nodemon** (dev): Development auto-reload.

**Key Files** (backend)
- `src/server.js` — app entry (mounts routes, middlewares)
- `src/lib/env.js` — environment loader and `ENV` export
- `src/lib/db.js` — MongoDB connection helper
- `src/lib/stream.js` — Stream chat/video clients and helpers (`chatClient`, `streamClient`, `upsertStreamUser`, `deleteStreamUser`)
- `src/lib/inngest.js` — Inngest functions to sync Clerk user events into DB and Stream
- `src/controllers/sessionController.js` — session CRUD / business logic
- `src/controllers/chatController.js` — Stream token endpoint
- `src/middlewares/protectRoute.js` — route protection and DB user lookup
- `src/models/User.js`, `src/models/Session.js` — Mongoose models
- `src/routes/sessionRoutes.js`, `src/routes/chatRoutes.js` — route definitions

**Flow Diagram (overview)**

Below is an ASCII flow diagram showing the main components and typical request lifecycle for a protected endpoint (example: creating a session).

```
Client (Browser / Frontend)
	|  (1) HTTP request with Clerk auth token (Authorization: Bearer <token>)
	v
Express Server (src/server.js)
	|-- global middlewares: `cors`, `json()`, etc.
	|
	+--> Route: `/api/sessions/` -> `sessionRoutes.js`
				 |
				 +--> `protectRoute` middleware stack:
							 - `requireAuth()` (Clerk verifies token)
							 - custom lookup: `User.findOne({ clerkId })` -> attach `req.user`
				 |
				 +--> Controller: `createSession` (src/controllers/sessionController.js)
								 - validates body
								 - writes a `Session` to MongoDB (`Session.create(...)`) via `mongoose`
								 - creates/gets a Stream video call: `streamClient.video.call("default", callId).getOrCreate(...)`
								 - creates a Stream chat channel: `chatClient.channel("messaging", callId, {...}).create()`
								 - returns the created session JSON

```

Third-party services and supporting flows:
- MongoDB: stores `User` and `Session` documents (via `mongoose`).
- Stream: chat and video services. `chatClient` for messaging; `streamClient.video` for calls.
- Inngest: background functions (e.g., `clerk/user.created` -> `sync-user`) that upsert the user into MongoDB and Stream using `upsertStreamUser`.

Sequence summary:
1) Frontend authenticates with Clerk and sends request with Clerk token.
2) `requireAuth()` validates token and exposes `req.auth()`.
3) Custom middleware looks up user in MongoDB by `clerkId` and sets `req.user`.
4) Controller uses `req.user` and business logic to create session, interact with Stream, and save to DB.
5) On user creation events (via Inngest), the backend creates a `User` record and calls Stream to upsert the Stream user record.


**How chat tokens work (quick)**
- The `GET /api/chat/token` endpoint uses `chatClient.createToken(req.user.clerkId)` to mint a Stream Chat token for the given Stream user id (the app uses Clerk's `clerkId` as Stream user id). The frontend should call this endpoint after the user is authenticated and then attach the `token` to the Stream Chat client initialization.

**Operational notes & troubleshooting**
- Ensure `STREAM_API_KEY` and `STREAM_API_SECRET` exist; the server logs an error if missing (see `src/lib/stream.js`).
- Ensure `DB_URL` is present or the server will exit (see `src/lib/db.js`).
- `protectRoute` implementation relies on `@clerk/express` and the app having Clerk properly configured (Clerk middleware and environment as per Clerk docs).
- Inngest functions call `connectDB()` before DB operations; verify DB network accessibility for event handlers.

## Connect With Me
- **LinkedIn:** https://www.linkedin.com/in/devadi 
- **GitHub:** https://github.com/ADI-2707