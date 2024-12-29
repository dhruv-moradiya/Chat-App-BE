import express from "express";
import {
  createOneOnOneChat,
  getMyChats,
} from "../controllers/chat.controller.js";
import {
  createOneOnOneChatValidator,
  validate,
} from "../validator/validator.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/create-one-on-one-chat",
  createOneOnOneChatValidator(),
  validate,
  verifyJWT,
  createOneOnOneChat
);

router.get("/my-chats", verifyJWT, getMyChats);

export default router;
