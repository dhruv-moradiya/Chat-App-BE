import { validationResult, body, query } from "express-validator";
import ApiError, { createError } from "../utils/ApiError.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  const errorString = extractedErrors
    .map((err) => {
      return Object.values(err);
    })
    .join(", ");

  throw new ApiError(422, errorString);
};

const userRegisterValidator = () => {
  return [
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .toLowerCase()
      .withMessage("Username must be lowercase"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength(6)
      .withMessage("Password must be at least 6 characters long"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength(6)
      .withMessage("Password must be at least 6 characters long"),
  ];
};

const createOneOnOneChatValidator = () => {
  return [
    body("receiverId")
      .trim()
      .notEmpty()
      .withMessage("Receiver id is required")
      .isMongoId()
      .withMessage("Receiver id is invalid"),

    body("chatName").trim().notEmpty().withMessage("Chat name is required"),
  ];
};

const sendFriendRequestValidator = () => {
  return [
    body("receiverId")
      .trim()
      .notEmpty()
      .withMessage("Receiver id is required")
      .isMongoId()
      .withMessage("Receiver id is invalid"),
  ];
};

const acceptOrRejectFriendRequestValidator = () => {
  return [
    body("friendRequestId")
      .trim()
      .notEmpty()
      .withMessage("Friend request id is required")
      .isMongoId()
      .withMessage("Friend request id is invalid"),
  ];
};

const getUsersExcludingFriendsBasedOnSearchValidator = () => {
  return [
    query("search").trim().notEmpty().withMessage("Search query is required"),
  ];
};

export {
  validate,
  userRegisterValidator,
  userLoginValidator,
  createOneOnOneChatValidator,
  sendFriendRequestValidator,
  acceptOrRejectFriendRequestValidator,
  getUsersExcludingFriendsBasedOnSearchValidator,
};
