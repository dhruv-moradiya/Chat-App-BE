import express from "express";
import { getAllNotifications } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getAllNotifications);

export default router;
