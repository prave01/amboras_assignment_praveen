
![enter image description here](https://upload.wikimedia.org/wikipedia/commons/0/09/Great_Wave_banner.jpg)
# Amboras  - Store Analytics Platform
This platform is a multi-tenant eCommerce analytics platform that ingests high-volume store events in real-time through a NestJS API backed by BullMQ and PostgreSQL, pre-aggregates metrics like revenue, conversion rates and top products every 60 seconds using a background cron job, caches the results in Redis for sub-millisecond dashboard responses, and serves the data through a secure JWT-authenticated API to a Next.js dashboard — ensuring each store owner only ever sees their own store's data while the system stays fast and scalable regardless of how many millions of events flow through it.

## Setup

### Prerequisites
- Node.js 20+
- pnpm
- Docker

### 1. Clone the repo
```bash
git clone https://github.com/prave01/amboras_assignment_praveen
cd amboras
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file at root
```bash
cp .env.example .env.local
```
```env
NODE_ENV=development
PORT=8080

DATABASE_URL=postgresql://amboras:amboras_secret@localhost:5432/amboras_db

REDIS_HOST=localhost
REDIS_PORT=6379

CORS_ORIGINS=http://localhost:3000
JWT_EXPIRESIN=4h

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
API_BASE_URL=http://localhost:8080

API_BASE_URL=http://localhost:8080
EVENTS_PER_SECOND=50
BATCH_SIZE=20
REALISTIC_MODE=false // set it true for 24hr real traffic scenario 
```



### 4. Start PostgreSQL and Redis
```bash
docker compose up -d
```

### 5. Run the Drizzle Studio Local
```bash
pnpm run db:studio
```



### 6. Run database migrations
```bash
pnpm run db:push
```

### 7. Seed the database
```bash
pnpm run db:seed
```



### 8. Start all apps
```bash
cd ../..
turbo dev // at root
```

This starts all three apps together via Turborepo:
- **API** → http://localhost:8080
- **Dashboard** → http://localhost:3000
- **Simulator** → starts firing events automatically


### 8. Login credentials

All test accounts use the same password:

| Email | Password |
|-------|----------|
| maya@streetkicks.com | Password123! |
| liam@techgear.io | Password123! |
| priya@botanica.store | Password123! |
| omar@desksupply.co | Password123! |
| sofie@lumenlights.eu | Password123! |
## Architecture Diagram
![enter image description here](https://github.com/prave01/amboras_assignment_praveen/blob/main/amboras.png)
## Tech Stack
-   **Turborepo** — monorepo management across all apps and packages
-   **NestJS** — backend API framework, event ingestion, analytics endpoints, cron job
-   **Next.js** — frontend dashboard with app router
-   **PostgreSQL** — primary database for raw events and aggregated metrics
-   **Drizzle ORM** — type-safe database queries and schema management
-   **Redis** — caching pre-aggregated metrics for fast dashboard reads
-   **BullMQ** — queue for batched event ingestion to prevent DB overload
-   **JWT** — authentication and multi-tenant security
-   **TypeScript** — end to end type safety across all apps
-   **Docker** — containerized PostgreSQL and Redis for local development
-   **pnpm** — package manager with workspace support

## Modules / Architecture Decisions
-   **Real-time event ingestion pipeline** — a dedicated event simulator continuously fires synthetic eCommerce events (page views, cart actions, purchases) at ~10,000 events/minute across 5 stores, batched and ingested via a NestJS API backed by BullMQ and PostgreSQL
-   **Pre-aggregation architecture for fast dashboards** — a background cron job runs every 60 seconds computing revenue, conversion rates and event counts per store across today/week/month periods, storing results in Redis so dashboard API responses are always sub-millisecond regardless of how many millions of events are in the database
-   **Multi-tenant security** — each store owner authenticates via JWT, and every analytics query is automatically scoped to their store using the token payload — no store can ever access another store's data
-   **Cache-first analytics API** — the three analytics endpoints (overview, top products, recent activity) read from Redis first and fall back to PostgreSQL only on a cache miss, keeping the dashboard load time under 500ms even at scale
-   **Production-minded data layer** — PostgreSQL schema uses composite indexes on `(store_id, timestamp)` and a unique index on `event_id` for deduplication, ensuring both fast range queries and idempotent event ingestion at high volume


### Simulator

-   Reads store and product IDs from `seed.json` at startup
-   Generates events with weighted randomness reflecting a real eCommerce funnel:
    -   `page_view` — 50%
    -   `add_to_cart` — 20%
    -   `remove_from_cart` — 10%
    -   `checkout_started` — 12%
    -   `purchase` — 8%
-   Batches 20 events per HTTP POST to reduce network overhead
-   Realistic mode scales traffic up/down based on hour of day using a time-of-day multiplier
-   Runs as a standalone TypeScript app, Dockerized for one-command startup

### Event Ingestion

-   `POST /api/v1/events/ingest` receives batched events from the simulator
-   Each event carries `event_id`, `store_id`, `event_type`, `timestamp` and a `data` object containing `product_id`, `amount` and `currency` where applicable — `purchase` events always include all three, `page_view` events carry none
-   Each batch is validated using `class-validator` DTOs — invalid event types, missing amounts on purchases, malformed UUIDs all rejected with 400
-   Valid batches are pushed into a BullMQ queue instead of writing directly to DB — keeping the HTTP response instant
-   BullMQ worker picks up each job and performs a single bulk insert into PostgreSQL
-   Duplicate events are silently ignored via unique index on `event_id`
### Database


-   PostgreSQL schema managed with Drizzle ORM for full type safety
-   `events` table has a composite index on `(store_id, timestamp DESC)` for fast per-store time range queries
-   `preAggregatedMetrics` table stores cron-computed results per store per period
-   `topProductsCache` table stores ranked product revenue per store per period
-   All UUIDs are pre-defined in `seed.json` so simulator always references valid store and product IDs

### Auth


-   `POST /api/v1/auth/login` validates email and password against seeded users
-   Password verified using bcrypt
-   JWT token issued containing `userId` and `storeId` in the payload
-   Token returned as httpOnly cookie — never exposed to JavaScript
-   All analytics endpoints protected by JWT guard — `storeId` extracted from token automatically scoping every query to the correct store

### **Cron Job / Pre-aggregation**


-   Runs every 60 seconds using `@nestjs/schedule`
-   Fetches all stores from DB once per tick
-   Fires 3 parallel `GROUP BY` queries via `Promise.all` — one per period (today, week, month)
-   DB does all aggregation internally — only 5 rows returned per query regardless of event volume
-   Computes total revenue, purchase count, page view count, total events and conversion rate per store per period
-   Results saved to Redis with 120 second TTL — auto-expires if cron stops running

### Analytics API
-   `GET /api/v1/analytics/overview` — reads from Redis first, falls back to DB on cache miss, returns today/week/month metrics
-   `GET /api/v1/analytics/top-products` — queries events table with `GROUP BY product_id`, sums revenue, returns top 10 ordered by revenue DESC
-   `GET /api/v1/analytics/recent-activity` — queries last 20 events ordered by timestamp DESC, always hits DB directly since it needs live data
-   All endpoints extract `storeId` from JWT — multi-tenancy enforced at the service layer
### Frontend


-   Built with Next.js 15 app router and Tailwind CSS with shadcn/ui components
-   Follows atomic design pattern — atoms (buttons, badges, cards), molecules (metric card, activity row), organisms (overview grid, products table, activity feed)
-   Data fetching uses Vercel SWR — automatic revalidation keeps dashboard fresh without manual refresh
-   Login page stores JWT as httpOnly cookie via a Next.js server action
-   Dashboard protected via middleware — redirects to login if no valid cookie
-   Loading states use shadcn Skeleton components
-   All monetary values formatted as `$X,XXX.XX`, conversion rate as `X.XX%`, timestamps as relative time

