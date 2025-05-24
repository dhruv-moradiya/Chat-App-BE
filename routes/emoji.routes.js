import express from "express";
import { getEmojis } from "../controllers/emoji.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getEmojis);

export default router;
