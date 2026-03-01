import "dotenv/config";
import logger from "./logger";
import db from "./db/database";
import { createApp } from "./app";

const PORT = process.env.PORT ?? 3001;
const app = createApp(db);

app.listen(PORT, () => {
  logger.info(`Procurement API running on http://localhost:${PORT}`);
});
