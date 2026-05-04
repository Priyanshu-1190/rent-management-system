# 🏠 Rent Management System

A full-stack rent management application for landlords to manage properties, units, tenants, and rent collection — built with **Next.js**, **Express 5**, and **PostgreSQL**.

---

## Tech Stack

| Layer     | Technology                                     |
| --------- | ---------------------------------------------- |
| Frontend  | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend   | Express 5, Node.js (CommonJS)                  |
| Database  | PostgreSQL (via `pg`)                           |
| Auth      | JWT (`jsonwebtoken`) + bcrypt                   |
| PDFs      | PDFKit                                          |
| Dev tools | Nodemon, ESLint, PostCSS                       |

---

## Project Structure

```
rent-management-system/
├── client/                     # Next.js frontend
│   ├── app/
│   │   ├── api/db-test/        # Proxy route → backend health check
│   │   ├── page.tsx            # Home page
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   └── scripts/
│       └── run-next.cjs        # Custom Next.js launcher (heap-limited)
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── index.js            # App entry point
│   │   ├── config/
│   │   │   └── db.js           # PostgreSQL pool
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── modules/
│   │   │   ├── auth/           # Register & login
│   │   │   ├── property/       # CRUD properties
│   │   │   ├── unit/           # Add units to properties
│   │   │   ├── tenancy/        # Create tenancies
│   │   │   ├── rent/           # Generate & pay rent
│   │   │   ├── dashboard/      # Owner and tenant dashboards
│   │   │   └── receipt/        # Payment receipt PDFs
│   │   ├── routes/
│   │   │   └── test.route.js   # /db-test health check
│   │   └── utils/
│   │       └── jwt.js          # Token helpers
│   └── sql/
│       └── domain.sql          # Core schema (properties, units, tenancies)
│
├── scripts/
│   └── dev.cjs                 # Runs client + server concurrently
├── package.json                # Root workspace scripts
└── .gitignore
```

Each backend module follows the **controller → service → routes** pattern for clean separation of concerns.

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Path        | Auth | Description          |
| ------ | ----------- | ---- | -------------------- |
| POST   | `/register` | ✗    | Create a new account |
| POST   | `/login`    | ✗    | Get a JWT token      |

### Properties (`/api/properties`)

| Method | Path | Auth | Description               |
| ------ | ---- | ---- | ------------------------- |
| POST   | `/`  | ✓    | Add a property            |
| GET    | `/`  | ✓    | List the owner's properties |

### Units (`/api/units`)

| Method | Path             | Auth | Description              |
| ------ | ---------------- | ---- | ------------------------ |
| POST   | `/:propertyId`   | ✓    | Add a unit to a property |

### Tenancies (`/api/tenancies`)

| Method | Path | Auth | Description       |
| ------ | ---- | ---- | ----------------- |
| POST   | `/`  | ✓    | Create a tenancy  |

### Rent (`/api/rent`)

| Method | Path           | Auth | Description              |
| ------ | -------------- | ---- | ------------------------ |
| POST   | `/generate`    | ✓    | Generate rent entries    |
| POST   | `/pay/:id`     | ✓    | Mark a rent entry as paid |

### Dashboards (`/api/dashboard`)

| Method | Path      | Auth | Description                                      |
| ------ | --------- | ---- | ------------------------------------------------ |
| GET    | `/owner`  | ✓    | Owner totals, property overview, payment status  |
| GET    | `/tenant` | ✓    | Tenant rent history, paid amount, receipt links  |

### Receipts (`/api/receipts`)

| Method | Path   | Auth | Description                         |
| ------ | ------ | ---- | ----------------------------------- |
| GET    | `/:id` | ✓    | Download a payment receipt as a PDF |

### Health

| Method | Path       | Auth | Description                  |
| ------ | ---------- | ---- | ---------------------------- |
| GET    | `/`        | ✗    | "API is running" check       |
| GET    | `/db-test` | ✗    | PostgreSQL connection check  |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** running locally (or a remote instance)

### 1. Clone the repository

```bash
git clone https://github.com/Priyanshu-1190/rent-management-system.git
cd rent-management-system
```

### 2. Install dependencies

```bash
# Root (installs the concurrent-dev script)
npm install

# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..
```

### 3. Configure the environment

Create `server/.env`:

```env
DB_USER=your_pg_user
DB_HOST=localhost
DB_NAME=your_db_name
DB_PASSWORD=your_pg_password
DB_PORT=5432
PORT=5000
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SCHEDULER_TIMEZONE=Asia/Kolkata
```

### 4. Set up the database

Run the schema script against your PostgreSQL database:

```bash
psql -U your_pg_user -d your_db_name -f server/sql/domain.sql
```

> **Note:** The `users` table must already exist (referenced by `properties` and `tenancies`). Create it if you haven't already.

### 5. Run the app

```bash
# Both client & server together (recommended)
npm run dev

# Or individually
npm run server   # Express on :5000
npm run client   # Next.js on :3000
```

---

## Environment Variables

| Variable      | Required | Default | Description                |
| ------------- | -------- | ------- | -------------------------- |
| `DB_USER`     | ✓        | —       | PostgreSQL user            |
| `DB_HOST`     | ✓        | —       | PostgreSQL host            |
| `DB_NAME`     | ✓        | —       | PostgreSQL database name   |
| `DB_PASSWORD` | ✓        | —       | PostgreSQL password        |
| `DB_PORT`     | ✓        | —       | PostgreSQL port            |
| `PORT`        | ✗        | `5000`  | Express server port        |
| `JWT_SECRET`  | ✓        | —       | Secret for signing JWTs    |
| `BACKEND_URL` | ✗        | `http://localhost:5000` | Backend URL used by the Next.js proxy |

---

## Development Notes

- The Next.js dev scripts use **Webpack** (not Turbopack) and cap the Node heap to reduce RAM usage — see `client/scripts/run-next.cjs`.
- The frontend proxies `/api/db-test` to the Express backend. If the backend is down, the UI shows an error message instead of a generic fallback.
- SQL `DATE` columns are parsed as plain strings (`YYYY-MM-DD`) to avoid timezone shift issues — see `server/src/config/db.js`.

---

## License

This project is for personal / educational use.
