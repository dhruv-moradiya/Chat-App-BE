import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.DATABASE_NAME,
    });

    console.log(
      "😍 Database connected successfully",
      connectionInstance.connection.host
    );
  } catch (err) {
    console.error("❌ Database connection failed", err.message);
    process.exit(1);
  }
};

export { connectDB };
