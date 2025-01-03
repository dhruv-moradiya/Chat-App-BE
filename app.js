import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket/index.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach Socket.IO to the app
app.set("io", io);

// Middleware
app.use(cors({ credentials: true, origin: ["http://localhost:5173"] }));
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

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/friendrequest", FriendRequestRoute);

// Socket.IO Initialization
initializeSocket(io);

// Error Handling Middleware
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

export { app, httpServer };
