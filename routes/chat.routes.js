import express from "express";
import {
  addParticipantInGroupChat,
  createGroupChat,
  createOneOnOneChat,
  getMyChats,
  removeParticipantFromGroupChat,
} from "../controllers/chat.controller.js";
import {
  addOrRemoveParticipantValidator,
  createGroupChatValidator,
  createOneOnOneChatValidator,
  validate,
} from "../validator/validator.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post(
  "/create-one-on-one-chat",
  verifyJWT,
  createOneOnOneChatValidator(),
  validate,
  createOneOnOneChat
);

router.post(
  "/create-group-chat",
  verifyJWT,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  // createGroupChatValidator(),
  // validate,
  createGroupChat
);

router.post(
  "/add-participant",
  verifyJWT,
  addOrRemoveParticipantValidator(),
  validate,
  addParticipantInGroupChat
);

router.post(
  "/remove-participant",
  verifyJWT,
  addOrRemoveParticipantValidator(),
  validate,
  removeParticipantFromGroupChat
);

router.get("/my-chats", verifyJWT, getMyChats);

export default router;
