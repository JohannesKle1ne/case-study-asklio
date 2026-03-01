import request from "supertest";
import Database from "better-sqlite3";
import { createApp } from "../app";

function createTestDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE procurement_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestor_name TEXT NOT NULL,
      title TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      vat_id TEXT NOT NULL,
      commodity_group_id TEXT NOT NULL,
      commodity_group_name TEXT NOT NULL,
      department TEXT NOT NULL,
      total_cost REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      position_description TEXT NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      unit TEXT NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
    );
    CREATE TABLE status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (request_id) REFERENCES procurement_requests(id) ON DELETE CASCADE
    );
  `);
  return db;
}

const validPayload = {
  requestor_name: "Jane Doe",
  title: "Office Equipment Q1",
  vendor_name: "AcmeCorp",
  vat_id: "DE123456789",
  commodity_group_id: "IT-HW-001",
  commodity_group_name: "IT Hardware",
  department: "Engineering",
  total_cost: 99.98,
  order_lines: [
    {
      position_description: "Laptop Stand",
      unit_price: 49.99,
      amount: 2,
      unit: "pieces",
      total_price: 99.98,
    },
  ],
};

describe("POST /api/procurementRequests", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(createTestDb());
  });

  it("creates a request and returns 201 with the new record", async () => {
    const res = await request(app).post("/api/procurementRequests").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe("Open");
    expect(res.body.requestor_name).toBe("Jane Doe");
  });

  it("returns 400 when required fields are missing", async () => {
    const { requestor_name: _, ...rest } = validPayload;
    const res = await request(app).post("/api/procurementRequests").send(rest);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 400 when the VAT ID format is invalid", async () => {
    const res = await request(app)
      .post("/api/procurementRequests")
      .send({ ...validPayload, vat_id: "invalid-vat" });

    expect(res.status).toBe(400);
    expect(res.body.errors.vat_id).toBeDefined();
  });

  it("returns 400 when order_lines is empty", async () => {
    const res = await request(app)
      .post("/api/procurementRequests")
      .send({ ...validPayload, order_lines: [] });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/procurementRequests/:id", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(createTestDb());
  });

  it("returns the request with order_lines and status_history", async () => {
    const created = await request(app)
      .post("/api/procurementRequests")
      .send(validPayload);

    const res = await request(app).get(`/api/procurementRequests/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.order_lines).toHaveLength(1);
    expect(res.body.status_history).toHaveLength(1);
    expect(res.body.status_history[0].new_status).toBe("Open");
    expect(res.body.status_history[0].old_status).toBeNull();
  });

  it("returns 404 for a non-existent id", async () => {
    const res = await request(app).get("/api/procurementRequests/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Request not found");
  });
});

describe("PATCH /api/procurementRequests/:id/status", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(createTestDb());
  });

  it("updates the status and records it in status_history", async () => {
    const created = await request(app)
      .post("/api/procurementRequests")
      .send(validPayload);

    const res = await request(app)
      .patch(`/api/procurementRequests/${created.body.id}/status`)
      .send({ status: "In Progress" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("In Progress");

    const detail = await request(app).get(
      `/api/procurementRequests/${created.body.id}`,
    );
    expect(detail.body.status_history).toHaveLength(2);
    expect(detail.body.status_history[1].old_status).toBe("Open");
    expect(detail.body.status_history[1].new_status).toBe("In Progress");
  });

  it("returns 400 when setting the same status", async () => {
    const created = await request(app)
      .post("/api/procurementRequests")
      .send(validPayload);

    const res = await request(app)
      .patch(`/api/procurementRequests/${created.body.id}/status`)
      .send({ status: "Open" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Status is already set to this value");
  });

  it("returns 400 for an invalid status value", async () => {
    const created = await request(app)
      .post("/api/procurementRequests")
      .send(validPayload);

    const res = await request(app)
      .patch(`/api/procurementRequests/${created.body.id}/status`)
      .send({ status: "Pending" });

    expect(res.status).toBe(400);
  });

  it("returns 404 for a non-existent id", async () => {
    const res = await request(app)
      .patch("/api/procurementRequests/999/status")
      .send({ status: "In Progress" });

    expect(res.status).toBe(404);
  });
});
