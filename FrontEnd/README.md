# WeCode — Frontend

This document describes the frontend structure, important files, environment variables, packages and tools used, how the frontend calls the backend APIs, and a flow diagram showing how auth, Stream, and the backend interact.

**How to run (local)**
- Install dependencies:
```powershell
cd FrontEnd; npm install
```
- Start dev server:
```powershell
npm run dev
```

**Environment variables** (use `.env` or your Vite env):
- `VITE_API_URL` — base URL for backend API (e.g. `http://localhost:3000/api`)
- `VITE_STREAM_API_KEY` — Stream API key used to initialize the Stream video client in the browser

Note: Clerk configuration is required (Clerk provider is used in app). Clerk setup typically uses its own provider/wrapping at app root and public keys configured in your environment.

**Top-level pages**
- `src/pages/HomePage.jsx` — public landing page and authentication prompts.
- `src/pages/DashboardPage.jsx` — signed-in dashboard that lists active and recent sessions and opens the `CreateSessionModal`.
- `src/pages/ProblemsPage.jsx` — list of practice problems.
- `src/pages/ProblemPage.jsx` — problem viewer with code editor and run/output panel.
- `src/pages/SessionPage.jsx` — live collaborative session page (video + chat + shared code).

**Important components and hooks**
- `src/components/Navbar.jsx` — top navigation and user actions.
- `src/components/CreateSessionModal.jsx` — modal to create a session (calls backend `POST /sessions`).
- `src/components/ActiveSessions.jsx`, `RecentSessions.jsx` — lists of sessions.
- `src/components/CodeEditorPanel.jsx` — Monaco editor integration (`@monaco-editor/react`).
- `src/components/VideoCallUI.jsx` — UI for video chat using Stream video client.
- `src/hooks/useSession.js` — hooks for interacting with session APIs (creates sessions, joins, ends, fetches lists).
- `src/hooks/useStreamClient.js` — manages Stream client initialization and lifecycle on the client.

**Client API helper**
- `src/lib/axios.js` exports an axios instance configured with `baseURL: import.meta.env.VITE_API_URL` and `withCredentials: true`. Use this instance when calling the backend to automatically send cookies used by Clerk sessions.

Example: create session from client (using axios instance):
```js
import axios from '../lib/axios'

const createSession = async (problem, difficulty) => {
	const res = await axios.post('/sessions', { problem, difficulty })
	return res.data
}
```

Example: get a Stream chat token (frontend should call after auth):
```js
const { data } = await axios.get('/chat/token')
// data: { token, userId, userName, userImage }
```

**Code execution (Piston)**
- The frontend uses `src/lib/piston.js` to call Piston's public API (`https://emkc.org/api/v2/piston/execute`) to run code. It passes language/version/files and normalizes results for the `OutputPanel`.

**Packages & Tools (from `FrontEnd/package.json`)**
- **Core React & routing:** `react`, `react-dom`, `react-router`, `react-router-dom` — app framework and routes
- **Clerk:** `@clerk/clerk-react` — authentication/identity provider and hooks (`useUser` usage in `App.jsx`)
- **HTTP:** `axios` — configured `src/lib/axios.js` to call backend (`withCredentials: true` so cookies are sent)
- **Stream (video & chat):** `@stream-io/video-react-sdk`, `stream-chat`, `stream-chat-react` — Stream video + chat SDKs used for video call UI and messaging
- **Editor:** `@monaco-editor/react` — Monaco code editor component used in `CodeEditorPanel`
- **React Query:** `@tanstack/react-query` — server state management for API calls (hooks likely use it)
- **UI:** `tailwindcss`, `daisyui` — styling; `lucide-react` for icons
- **Utilities:** `date-fns`, `canvas-confetti` (celebration on successful run)
- **Other:** `react-hot-toast` for notifications; `react-resizable-panels` for resizable editor/output panels

**App entry and routing**
- `src/App.jsx` wraps routes and uses `useUser()` from Clerk. It redirects based on sign-in status and mounts these routes:
	- `/` Home
	- `/dashboard` Dashboard
	- `/problems` Problems list
	- `/problem/:id` Problem page
	- `/session/:id` Session page

**Frontend → Backend interactions**
- Authentication: front-end relies on Clerk for sign-in. After authentication, requests to the backend send credentials (cookies) because `axios` is configured with `withCredentials: true`.
- Creating / managing sessions: frontend uses endpoint group `/sessions` (see backend README). Examples:
	- `POST /sessions` — create a session (body: `{ problem, difficulty }`)
	- `POST /sessions/:id/join` — join a session
	- `POST /sessions/:id/end` — end session (host only)
	- `GET /sessions/active` — get active sessions
	- `GET /sessions/my-recent` — user-specific recent sessions
- Chat tokens: frontend calls `GET /chat/token` to receive Stream chat token and user info, then calls `initializeStreamClient(user, token)` (see `src/lib/stream.js`) to create the Stream video client.

**Frontend flow diagram (ASCII)**
```
Browser / Frontend
	|  (1) Clerk sign-in (hosted or widget) -> browser stores Clerk session cookie
	v
UI Components (Dashboard / Session / Problem)
	|  (2) User triggers action (create session / join / run code)
	v
Client API (src/lib/axios.js)  -- sends requests to --> Backend `VITE_API_URL` (/api)
	|  (3) axios sends cookie (withCredentials: true) so backend's `requireAuth()` can validate
	v
Backend (see `BackEnd` README)
	|  (4) Backend returns session data or stream token
	v
Frontend receives data
	|  (5) If Stream token is returned, call `initializeStreamClient({ id: user.id, name }, token)`
	v
Stream Video & Chat (3rd party)
	|  (6) Stream provides video rooms, chat channels. Frontend subscribes to video streams and chat events via SDK.
```

Sequence summary:
1) User signs in with Clerk in browser.
2) Frontend uses `axios` (with credentials) to call protected backend endpoints.
3) Backend validates request and responds with session data or chat token.
4) If a Stream token is returned, frontend initializes the Stream video client and chat UI with the returned token/user info.

**Developer notes & suggestions**
- Keep `VITE_API_URL` consistent with backend routes (prefix `/api` if backend is mounted that way).
- For local development, set `VITE_STREAM_API_KEY` from your Stream dashboard.
- Consider adding a small Postman / Insomnia collection and a Postman environment to make manual testing of the backend easy.
- If you want a visual diagram (SVG/PNG), I can generate a Draw.io or mermaid diagram and add it to the README.

## Connect With Me
- **LinkedIn:** https://www.linkedin.com/in/devadi 
- **GitHub:** https://github.com/ADI-2707