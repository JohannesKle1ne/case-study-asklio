# Procurement Backend

REST API for the askLio Procurement Request application. Built with **Express**, **TypeScript**, **SQLite** (better-sqlite3), and **OpenAI GPT-4o**.

## Tech stack

- **Runtime:** Node.js (≥ 20)
- **Framework:** Express 4
- **Database:** SQLite via better-sqlite3 (file-based, auto-created on first start)
- **AI:** OpenAI GPT-4o — PDF data extraction & commodity group classification
- **Validation:** Zod
- **Logging:** Winston
- **Testing:** Jest + Supertest

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your OpenAI API key:

| Variable         | Required | Description                                                         |
| ---------------- | -------- | ------------------------------------------------------------------- |
| `OPENAI_API_KEY` | **Yes**  | OpenAI API key used for PDF extraction and commodity classification |

### 3. Run in development

```bash
npm run dev
```

The API is available at `http://localhost:3001`.  
Interactive API docs (Swagger UI) are at `http://localhost:3001/api-docs`.

### 4. Run tests

```bash
npm test
```

Tests use an in-memory SQLite database and do not require a running server or an OpenAI key.

### 5. Build for production

```bash
npm run build   # compiles TypeScript to dist/
npm start       # runs the compiled output
```

## API overview

| Method  | Path                                  | Description                                                      |
| ------- | ------------------------------------- | ---------------------------------------------------------------- |
| `GET`   | `/api/procurementRequests`            | List all procurement requests                                    |
| `POST`  | `/api/procurementRequests`            | Create a new procurement request                                 |
| `GET`   | `/api/procurementRequests/:id`        | Get a single request with order lines and status history         |
| `PATCH` | `/api/procurementRequests/:id/status` | Update request status (`Open` → `In Progress` → `Closed`)        |
| `POST`  | `/api/extract`                        | Upload a vendor offer PDF and extract structured data via GPT-4o |
| `POST`  | `/api/suggest-commodity`              | Classify item descriptions into a commodity group via GPT-4o     |
| `GET`   | `/api/commodity-groups`               | List all available commodity groups                              |

Full request/response schemas are documented in the Swagger UI at `/api-docs`.

## Database

The SQLite database is created automatically at `data/procurement.db` on first start. No migration steps are needed. The `data/` directory is git-ignored.

## Project structure

```
src/
├── index.ts              # Entry point — starts the HTTP server
├── app.ts                # Express app factory (used by both server and tests)
├── logger.ts             # Winston logger
├── swagger.ts            # OpenAPI / Swagger spec
├── data/
│   └── commodityGroups.ts  # Static list of commodity groups
├── db/
│   └── database.ts       # SQLite connection and schema initialisation
├── routes/
│   ├── procurementRequests.ts  # CRUD for procurement requests
│   ├── extract.ts              # PDF upload + GPT-4o extraction
│   ├── suggestCommodity.ts     # GPT-4o commodity classification
│   └── commodityGroups.ts      # Commodity groups list endpoint
├── schemas/
│   └── procurementRequest.ts   # Zod validation schemas
├── services/
│   └── openai.ts         # Lazy-initialised OpenAI client
└── __tests__/
    └── procurementRequests.integration.test.ts
```
