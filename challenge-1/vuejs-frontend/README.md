# Procurement Frontend

Vue 3 single-page application for the askLio Procurement Request tool.

## Tech stack

- **Framework:** Vue 3 (Composition API) + TypeScript
- **Build tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Routing:** Vue Router 5
- **Forms & validation:** vee-validate + Zod
- **Icons:** Lucide Vue Next

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable       | Required | Description                                                      |
| -------------- | -------- | ---------------------------------------------------------------- |
| `VITE_API_URL` | **Yes**  | Base URL of the backend API (default points to `localhost:3001`) |

### 3. Start the backend

The frontend requires the backend to be running. See the [backend README](../backend/README.md) for setup instructions.

### 4. Run in development

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build   # type-check + Vite build → dist/
npm run preview # preview the production build locally
```

## Features

- **New Procurement Request** — fill in requestor, vendor, and order line details and submit a new request.
- **PDF auto-fill** — upload a vendor offer PDF; GPT-4o extracts vendor name, VAT ID, department, order lines, and total cost and pre-fills the form.
- **Commodity group suggestion** — as order line descriptions are typed (or filled from a PDF), the backend classifies them into the best-matching commodity group automatically.
- **Request Overview** — table of all requests with status filtering, expandable detail rows (order lines + status history), and inline status updates.

## Project structure

```
src/
├── main.ts                  # App entry point
├── App.vue                  # Root component — navigation shell
├── router/
│   └── index.ts             # Route definitions
├── views/
│   ├── NewRequestView.vue        # New request form + PDF upload
│   └── RequestOverviewView.vue   # Request list and management
├── components/
│   ├── RequesterDetails.vue  # Requestor name, title, department fields
│   ├── VendorDetails.vue     # Vendor name, VAT ID, PDF upload
│   ├── OrderLines.vue        # Order line table (add/remove/edit rows)
│   ├── CommodityGroup.vue    # Commodity group suggestion display
│   ├── RequestTableRow.vue   # Expandable row in the overview table
│   └── SubmissionResult.vue  # Success / error feedback after submit
├── services/
│   └── api.ts               # All fetch calls to the backend API
├── types/
│   └── procurement.ts       # Shared TypeScript interfaces
└── utils/
    └── requestFormatters.ts  # Status colours, date formatting, history labels
```
