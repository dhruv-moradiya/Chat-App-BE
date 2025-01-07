import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createMessage } from "../controllers/message.controller.js";
import { createMessageValidator, validate } from "../validator/validator.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post(
  "/create-message",
  verifyJWT,
  upload.fields([{ name: "attachments", maxCount: 4 }]),
  createMessageValidator(),
  validate,
  createMessage
);

export default router;
