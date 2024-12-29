import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

dotenv.config({
  path: ".env",
});

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public/temp"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Welcome to the File Chat App Backend!");
});

import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import FriendRequestRoute from "./routes/friendrequest.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/friendrequest", FriendRequestRoute);

app.use((err, req, res, next) => {
  errorMiddleware(err, req, res, next);
});

export { app };
