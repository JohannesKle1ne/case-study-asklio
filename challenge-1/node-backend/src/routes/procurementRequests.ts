import { Router, Request, Response } from "express";
import type { Database } from "better-sqlite3";
import {
  createProcurementRequestSchema,
  updateStatusSchema,
} from "../schemas/procurementRequest";
import logger from "../logger";

export function createProcurementRequestsRouter(db: Database) {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    try {
      const requests = db
        .prepare("SELECT * FROM procurement_requests ORDER BY created_at DESC")
        .all();
      res.json(requests);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to list requests", { error: message });
      res.status(500).json({ error: message });
    }
  });

  router.get("/:id", (req: Request, res: Response) => {
    try {
      const request = db
        .prepare("SELECT * FROM procurement_requests WHERE id = ?")
        .get(req.params.id);

      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      const orderLines = db
        .prepare(
          "SELECT * FROM order_lines WHERE request_id = ? ORDER BY id ASC",
        )
        .all(req.params.id);

      const statusHistory = db
        .prepare(
          "SELECT * FROM status_history WHERE request_id = ? ORDER BY changed_at ASC",
        )
        .all(req.params.id);

      res.json({
        ...(request as object),
        order_lines: orderLines,
        status_history: statusHistory,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to get request", {
        id: req.params.id,
        error: message,
      });
      res.status(500).json({ error: message });
    }
  });

  router.post("/", (req: Request, res: Response) => {
    const parsed = createProcurementRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: parsed.error.flatten().fieldErrors });
    }

    const {
      requestor_name,
      title,
      vendor_name,
      vat_id,
      commodity_group_id,
      commodity_group_name,
      department,
      total_cost,
      order_lines,
    } = parsed.data;

    const insertRequest = db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO procurement_requests
          (requestor_name, title, vendor_name, vat_id, commodity_group_id, commodity_group_name, department, total_cost, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open')`,
        )
        .run(
          requestor_name,
          title,
          vendor_name,
          vat_id,
          commodity_group_id,
          commodity_group_name,
          department,
          total_cost,
        );

      const requestId = result.lastInsertRowid;

      const insertLine = db.prepare(
        `INSERT INTO order_lines (request_id, position_description, unit_price, amount, unit, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      );

      for (const line of order_lines) {
        insertLine.run(
          requestId,
          line.position_description,
          line.unit_price,
          line.amount,
          line.unit,
          line.total_price,
        );
      }

      db.prepare(
        `INSERT INTO status_history (request_id, old_status, new_status) VALUES (?, NULL, 'Open')`,
      ).run(requestId);

      return requestId;
    });

    try {
      const newId = insertRequest();
      const newRequest = db
        .prepare("SELECT * FROM procurement_requests WHERE id = ?")
        .get(newId);
      logger.info("Procurement request created", { id: newId });
      res.status(201).json(newRequest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to create request", { error: message });
      res.status(500).json({ error: message });
    }
  });

  router.patch("/:id/status", (req: Request, res: Response) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { status } = parsed.data;

    try {
      const request = db
        .prepare("SELECT * FROM procurement_requests WHERE id = ?")
        .get(req.params.id) as { id: number; status: string } | undefined;

      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (request.status === status) {
        return res
          .status(400)
          .json({ error: "Status is already set to this value" });
      }

      const updateStatus = db.transaction(() => {
        db.prepare(
          "UPDATE procurement_requests SET status = ? WHERE id = ?",
        ).run(status, req.params.id);
        db.prepare(
          "INSERT INTO status_history (request_id, old_status, new_status) VALUES (?, ?, ?)",
        ).run(req.params.id, request.status, status);
      });

      updateStatus();

      const updated = db
        .prepare("SELECT * FROM procurement_requests WHERE id = ?")
        .get(req.params.id);

      logger.info("Request status updated", {
        id: req.params.id,
        from: request.status,
        to: status,
      });
      res.json(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to update status", {
        id: req.params.id,
        error: message,
      });
      res.status(500).json({ error: message });
    }
  });

  return router;
}

export default createProcurementRequestsRouter;
