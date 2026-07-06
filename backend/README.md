# Vita Flux — Backend

Express + PostgreSQL + **Socket.IO** (optional Redis adapter) for the Vita Flux blood bank system.

## Prerequisites

- Node.js 20+
- PostgreSQL with database **`Vita`** created:

```sql
CREATE DATABASE "Vita";
```

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env if needed
npm install
npm run db:migrate
npm run dev
```

- API: `http://localhost:3000` (or `PORT` from `.env`)
- Health: `GET /health`, `GET /health/db`
- Socket.IO: `http://localhost:3000/socket.io/` — see [docs/REALTIME.md](./docs/REALTIME.md) (hospital rooms, events, Redis scaling).

## Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — system rules, data model, FIFO, transfers, API contract.
- [docs/REALTIME.md](./docs/REALTIME.md) — Socket.IO events, rooms, dedupe, Redis.

## Inventory API (implemented)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/inventory/add` | Add blood (batch + `ADD_BLOOD`) |
| `POST` | `/api/inventory/consume` | FIFO consumption (`REMOVE` tx) |
| `POST` | `/api/inventory/remove` | Alias of `consume` |
| `POST` | `/api/inventory/dispose` | Dispose expired `AVAILABLE` batches |
| `GET` | `/api/inventory/summary?hospitalId=&at=YYYY-MM-DD` | Totals, added/removed today, by blood type |

Run `npm run db:migrate` so enum value `REMOVE` exists (`002_add_remove_transaction_type.sql`), and request statuses include `IN_TRANSIT` / `COMPLETED` (`003_expand_request_status_enum.sql`).

## Requests & transfers

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/governorates` | List governorates |
| `GET` | `/api/hospitals` | All hospitals (optional `?governorateId=`) |
| `GET` | `/api/requests/filters` | Metadata for filter UI |
| `GET` | `/api/requests` | Paginated, filtered list (`Apply` = query params) |
| `GET` | `/api/requests/analytics` | Counts by status/kind in date range (`fromDate`, `toDate`, optional `governorate`) |
| `GET` | `/api/requests/:id` | Details with hospital / governorate names |
| `POST` | `/api/requests` | Body: DEM `{ hospitalId, bloodType, quantity, governorateId? }` or TR `{ kind:'TRANSFER', fromHospitalId, toHospitalId, bloodType, quantity }` |
| `POST` | `/api/requests/:id/approve` | Receiver only; FIFO transfer; status → **COMPLETED** |
| `POST` | `/api/requests/:id/reject` | Receiver only; status → **REJECTED** |

See [docs/TRANSFER_REQUESTS.md](./docs/TRANSFER_REQUESTS.md).

Inventory-only mutations remain under `/api/inventory/*` (add / consume / dispose / summary). Transfer creation is **`POST /api/requests`** only.

## Security note

Do not commit `.env`. Use `.env.example` for templates.
