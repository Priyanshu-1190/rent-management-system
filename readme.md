# Rent Management System

Day 1 foundation:

- `client/` contains the Next.js frontend.
- `server/` contains the Express API and PostgreSQL connection.

Run locally:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Or run both together from the project root:

```bash
npm run dev
```

Frontend memory note:

- The Next.js scripts use a small launcher in `client/scripts/run-next.cjs`.
- `npm run dev` uses Webpack instead of Turbopack and caps the Node heap to reduce RAM usage during development.

Frontend-backend note:

- The frontend calls `client/app/api/db-test/route.ts`, which proxies to the Express backend.
- By default the proxy uses `http://localhost:5000`.
- If your backend runs on a different URL, set `BACKEND_URL` before starting the client.
- If the backend is not running, the UI now shows that directly instead of the generic database-test message.
