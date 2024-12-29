import express from "express";
import {
  createUser,
  getAllUsers,
  getCurrentUser,
  getUsersExcludingFriends,
  getUsersExcludingFriendsBasedOnSearch,
  loginUser,
  logoutUser,
} from "../controllers/user.controller.js";
import {
  getUsersExcludingFriendsBasedOnSearchValidator,
  userLoginValidator,
  userRegisterValidator,
  validate,
} from "../validator/validator.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-user", userRegisterValidator(), validate, createUser);

router.post("/login-user", userLoginValidator(), validate, loginUser);

router.post("/logout-user", verifyJWT, logoutUser);

router.get("/current-user", verifyJWT, getCurrentUser);

router.get("/all-users", verifyJWT, getAllUsers);

router.get("/excluding-friends", verifyJWT, getUsersExcludingFriends);

router.get(
  "/excluding-friends-search",
  verifyJWT,
  getUsersExcludingFriendsBasedOnSearchValidator(),
  validate,
  getUsersExcludingFriendsBasedOnSearch
);

export default router;
