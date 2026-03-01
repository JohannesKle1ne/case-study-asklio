import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import type { Database } from "better-sqlite3";
import logger from "./logger";
import { swaggerSpec } from "./swagger";
import { createProcurementRequestsRouter } from "./routes/procurementRequests";
import extractRouter from "./routes/extract";
import suggestCommodityRouter from "./routes/suggestCommodity";
import commodityGroupsRouter from "./routes/commodityGroups";

export function createApp(db: Database) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      body: req.method !== "GET" ? req.body : undefined,
    });
    next();
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api/procurementRequests", createProcurementRequestsRouter(db));
  app.use("/api/extract", extractRouter);
  app.use("/api/suggest-commodity", suggestCommodityRouter);
  app.use("/api/commodity-groups", commodityGroupsRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("Unhandled error", { error: err.message, stack: err.stack });
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  return app;
}
