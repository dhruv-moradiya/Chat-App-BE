import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.DATABASE_NAME,
    });

    logger.success(
      "😍 Database connected successfully",
      connectionInstance.connection.host
    );
  } catch (err) {
    logger.error("❌ Database connection failed", err.message);
    process.exit(1);
  }
};

export { connectDB };
