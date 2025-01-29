import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  clearChatMessages,
  createMessage,
  deleteMessage,
  deleteMessageForSelectedParticipants,
  getMessagesBasedOnChatId,
} from "../controllers/message.controller.js";
import {
  clearChatMessagesValidator,
  createMessageValidator,
  deleteMessageForSelectedParticipantsValidator,
  deleteMessageValidator,
  validate,
} from "../validator/validator.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post(
  "/send-message",
  verifyJWT,
  upload.fields([{ name: "attachments", maxCount: 4 }]),
  createMessageValidator(),
  validate,
  createMessage
);

router.get(
  "/get-messages-by-chat/:chatId",
  verifyJWT,
  getMessagesBasedOnChatId
);

router.patch(
  "/delete-for-selected",
  verifyJWT,
  deleteMessageForSelectedParticipantsValidator(),
  validate,
  deleteMessageForSelectedParticipants
);

router.delete(
  "/message",
  verifyJWT,
  deleteMessageValidator(),
  validate,
  deleteMessage
);

router.delete(
  "/clear-chat-messages",
  verifyJWT,
  clearChatMessagesValidator(),
  validate,
  clearChatMessages
);

export default router;
