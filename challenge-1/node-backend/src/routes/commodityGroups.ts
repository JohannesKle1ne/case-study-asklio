import { Router, Request, Response } from "express";
import COMMODITY_GROUPS from "../data/commodityGroups";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(COMMODITY_GROUPS);
});

export default router;
