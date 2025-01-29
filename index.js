import dotenv from "dotenv";

const environment = process.env.NODE_ENV || "development";

dotenv.config({
  path: environment === "production" ? ".env.production" : ".env.development",
});

import { connectDB } from "./db/index.js";
import { httpServer } from "./app.js";
import { logger } from "./utils/logger.js";

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logger.success(`😍 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    logger.error("❌ Database connection failed");
  });
