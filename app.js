import http from "http";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { initializeSocket } from "./socket/index.js";

const environment = process.env.NODE_ENV || "development";

dotenv.config({
  path: environment === "production" ? ".env.production" : ".env.development",
});

const app = express();
const httpServer = http.createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach Socket.IO to the app
app.set("io", io);

app.options(
  "*",
  cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// Middleware
app.use(
  cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the File Chat App Backend!");
});

import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import FriendRequestRoute from "./routes/friendrequest.routes.js";
import MessagesRoute from "./routes/message.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/friendrequest", FriendRequestRoute);
app.use("/api/v1/message", MessagesRoute);

// Socket.IO Initialization
initializeSocket(io);

// Error Handling Middleware
app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Internal Server Error" });
});

export { app, httpServer };
