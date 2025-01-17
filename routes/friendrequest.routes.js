import express from "express";
import {
  acceptFriendRequest,
  getMyFriendRequest,
  getMyFriendsList,
  rejectFriendRequest,
  sendFriendRequest,
} from "../controllers/friendRequest.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  acceptOrRejectFriendRequestValidator,
  sendFriendRequestValidator,
  validate,
} from "../validator/validator.js";

const router = express.Router();

router.post(
  "/send-friend-request",
  verifyJWT,
  sendFriendRequestValidator(),
  validate,
  sendFriendRequest
);

router.post(
  "/accept-friend-request",
  verifyJWT,
  acceptOrRejectFriendRequestValidator(),
  validate,
  acceptFriendRequest
);

router.post(
  "/reject-friend-request",
  verifyJWT,
  acceptOrRejectFriendRequestValidator(),
  validate,
  rejectFriendRequest
);

router.get("/get-my-friends", verifyJWT, getMyFriendsList);

router.get("/get-friend-requests", verifyJWT, getMyFriendRequest);

export default router;
