import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createError } from "../utils/ApiError.js";

const createOneOnOneChat = asyncHandler(async (req, res) => {
  const { receiverId, chatName } = req.body;

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    throw createError.badRequest("Invalid receiver id");
  }

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    throw createError.notFound("Receiver not found");
  }

  if (receiverId.toString() === req.user._id.toString()) {
    throw createError.badRequest("You can't start a chat with yourself");
  }

  const isChatExist = await Chat.aggregate([
    {
      $match: {
        participants: {
          $all: [
            new mongoose.Types.ObjectId(req.user._id),
            new mongoose.Types.ObjectId(receiverId),
          ],
        },
      },
    },
  ]);

  if (isChatExist.length > 0) {
    throw createError.badRequest("Chat already exist");
  }

  const chat = await Chat.create({
    participants: [req.user._id, receiverId],
    chatName: chatName,
    messages: [],
    isGroup: false,
  });

  if (!chat) {
    throw createError.internalServerError("Chat creation failed");
  }

  res.status(201).json(new ApiResponse(201, chat, "Chat created successfully"));
});

const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.aggregate([
    {
      $match: {
        participants: {
          $elemMatch: {
            $eq: new mongoose.Types.ObjectId(req.user._id),
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participants",
      },
    },
    {
      $project: {
        __v: 0,
        messages: 0,
        "participants.refreshToken": 0,
        "participants.__v": 0,
        "participants.friends": 0,
        "participants.mutedChats": 0,
        "participants.createdAt": 0,
        "participants.updatedAt": 0,
      },
    },
  ]);

  if (!chats) {
    throw createError.notFound("No chats found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats fetched successfully"));
});

export { createOneOnOneChat, getMyChats };
