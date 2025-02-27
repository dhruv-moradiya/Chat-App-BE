import mongoose, { Mongoose } from "mongoose";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createError } from "../utils/ApiError.js";
import { uploadFilesToCloudinary } from "../utils/cloudinary.js";

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

  return res
    .status(201)
    .json(new ApiResponse(201, chat, "Chat created successfully"));
});

const createGroupChat = asyncHandler(async (req, res) => {
  const { chatName, participantIds } = req.body;

  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw createError.badRequest("Participant IDs must be provided.");
  }

  const Ids = participantIds.map((id) => new mongoose.Types.ObjectId(id));

  const isAllParticipantsExistInFriendArray = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $addFields: {
        missingIds: {
          $filter: {
            input: Ids,
            as: "id",
            cond: { $not: { $in: ["$$id", "$friends"] } },
          },
        },
      },
    },
    { $project: { _id: 1, missingIds: 1 } },
  ]);

  const missingIds = isAllParticipantsExistInFriendArray[0]?.missingIds || [];
  if (missingIds.length > 0) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          { missingIds },
          "Participant IDs not found in friends list"
        )
      );
  }

  const participantsArray = [...Ids, new mongoose.Types.ObjectId(req.user._id)];

  const isChatExist = await Chat.aggregate([
    {
      $match: {
        isGroup: true,
        participants: { $all: participantsArray },
      },
    },
  ]);

  if (isChatExist.length > 0) {
    throw createError.badRequest("Chat already exists");
  }

  let coverImageData;
  try {
    if (
      req.files &&
      req.files.coverImage &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      const coverImagePath = req.files.coverImage[0].path;
      const coverImagePublicId = req.files.coverImage[0].originalname;
      const response = await uploadFilesToCloudinary(
        [coverImagePath],
        req.user.username,
        [coverImagePublicId]
      );
      const { secure_url: url, public_id: publicId } = response[0];
      coverImageData = { url, fileName: coverImagePublicId, publicId };
    } else {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Cover image is required"));
    }
  } catch (error) {
    throw createError.internalServerError("Failed to upload cover image");
  }

  const unreadMessageCountMap = new Map([]);

  participantsArray.forEach((id) => {
    unreadMessageCountMap.set(id, 0);
  });

  const chat = await Chat.create({
    participants: participantsArray,
    chatName,
    isGroup: true,
    admin: req.user._id,
    coverImage: coverImageData,
    unreadMessagesCounts: unreadMessageCountMap,
  });

  const populatedChat = await Chat.findById(chat._id).populate(
    "participants",
    "username email profilePicture _id"
  );

  if (!chat) {
    throw createError.internalServerError("Chat creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, populatedChat, "Chat created successfully"));
});

const addParticipantInGroupChat = asyncHandler(async (req, res) => {
  const { chatId, participantId } = req.body;

  const chat = await Chat.findByIdAndUpdate(chatId, {
    $push: { participants: participantId },
  });

  if (!chat) {
    throw createError.internalServerError("Chat creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, chat, "Participant added successfully"));
});

const removeParticipantFromGroupChat = asyncHandler(async (req, res) => {
  const { chatId, participantId } = req.body;

  const chat = await Chat.findByIdAndUpdate(chatId, {
    $pull: { participants: participantId },
  });

  if (!chat) {
    throw createError.internalServerError("Chat creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, chat, "Participant removed successfully"));
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
        "participants.password": 0,
      },
    },
  ]);

  if (!chats) {
    throw createError.notFound("No chats found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats fetched successfully"));
});

export {
  createOneOnOneChat,
  getMyChats,
  createGroupChat,
  addParticipantInGroupChat,
  removeParticipantFromGroupChat,
};
