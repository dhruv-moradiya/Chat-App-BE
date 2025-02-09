import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  clearChatMessages,
  createMessage,
  deleteMessage,
  deleteMessageForSelectedParticipants,
  getMessagesBasedOnChatId,
  saveAttachmentInDatabase,
} from "../controllers/message.controller.js";
import {
  clearChatMessagesValidator,
  createMessageValidator,
  deleteMessageForSelectedParticipantsValidator,
  deleteMessageValidator,
  saveAttachmentValidator,
  validate,
} from "../validator/validator.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

// To send a message
router.post(
  "/send-message",
  verifyJWT,
  upload.fields([{ name: "attachments", maxCount: 4 }]),
  createMessageValidator(),
  validate,
  createMessage
);

// To save attachment in database
router.post(
  "/save-attachments",
  verifyJWT,
  upload.fields([{ name: "attachments", maxCount: 4 }]),
  saveAttachmentValidator(),
  validate,
  saveAttachmentInDatabase
);

// To get messages based on chat id
router.get(
  "/get-messages-by-chat/:chatId",
  verifyJWT,
  getMessagesBasedOnChatId
);

// To delete message for selected participants
router.patch(
  "/delete-for-selected",
  verifyJWT,
  deleteMessageForSelectedParticipantsValidator(),
  validate,
  deleteMessageForSelectedParticipants
);

// To delete a message
router.delete(
  "/message",
  verifyJWT,
  deleteMessageValidator(),
  validate,
  deleteMessage
);

// To clear chat messages
router.delete(
  "/clear-chat-messages",
  verifyJWT,
  clearChatMessagesValidator(),
  validate,
  clearChatMessages
);

export default router;
