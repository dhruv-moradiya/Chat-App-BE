import mongoose from "mongoose";
import Message from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFilesToCloudinary } from "../utils/cloudinary.js";
import { createError } from "../utils/ApiError.js";
import {
  emitEventForMessageDeleteEitherForEveryoneOrSelf,
  emitEventForNewMessageReceived,
  emitEventForUpdatedMessageWithAttachment,
} from "../socket/index.js";
import Chat from "../models/chat.model.js";

const uploadAttachmentOnCloudinary = (
  req,
  chatId,
  message,
  attachmentsLocalPath,
  publicIds
) => {
  let attachmentsData = [];
  uploadFilesToCloudinary(attachmentsLocalPath, req.user.username, publicIds)
    .then(async (uploadedFiles) => {
      attachmentsData = uploadedFiles.map((file) => ({
        url: file.secure_url,
        fileName: file.original_filename,
        publicId: file.public_id,
      }));

      const updatedMessage = await Message.findOneAndUpdate(
        { _id: message._id },
        { $set: { attachments: attachmentsData } },
        { new: true }
      );

      const messageResponseForSocket = {
        ...updatedMessage.toObject(),
        sender: req.user,
      };

      emitEventForUpdatedMessageWithAttachment(
        req.app.get("io"),
        chatId,
        messageResponseForSocket
      );
    })
    .catch((err) => {
      console.error("Error uploading files to Cloudinary:", err);
      attachmentsData = [];
    });
};

const createMessage = asyncHandler(async (req, res) => {
  const { chatId, content, replyTo } = req.body;

  const senderId = req.user._id;

  const attachments = req.files?.attachments;

  if (!content && !attachments) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Please provide content or attachments"));
  }

  let newMessageData = {};

  newMessageData = {
    sender: senderId,
    chat: chatId,
    content: content ? content : "",
    ...(replyTo && { replyTo }),
  };

  const message = await Message.create(newMessageData);
  const messageObject = message.toObject();
  delete messageObject.__v;

  if (attachments && Array.isArray(attachments) && attachments.length) {
    const attachmentsLocalPath = attachments.map((file) => file.path);
    const publicIds = attachments.map((file) => file.originalname);

    uploadAttachmentOnCloudinary(
      req,
      chatId,
      message,
      attachmentsLocalPath,
      publicIds
    );
  }

  if (!message) {
    throw createError.internalServerError("Failed to create message");
  }

  const messageResponse = {
    _id: message._id,
  };

  const messageResponseForSocket = {
    ...message.toObject(),
    sender: req.user,
    ...(attachments &&
      Array.isArray(attachments) &&
      attachments.length && { isAttachment: true }),
  };

  emitEventForNewMessageReceived(
    req.app.get("io"),
    chatId,
    messageResponseForSocket
  );

  res
    .status(201)
    .json(
      new ApiResponse(201, messageResponse, "Message created successfully")
    );
});

const getMyMessages = asyncHandler(async (req, res) => {
  const { user } = req;

  const messages = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: user._id }],
      },
    },
  ]);

  return new ApiResponse(200, messages, "Messages fetched successfully");
});

const getMessagesBasedOnChatId = asyncHandler(async (req, res, next) => {
  try {
    const { chatId } = req.params;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) {
      return next(
        createError.badRequest(400, "'page' must be a positive integer.")
      );
    }

    if (isNaN(limit) || limit < 1) {
      return next(
        createError.badRequest(400, "'limit' must be a positive integer.")
      );
    }

    const skip = (page - 1) * limit;
    const chatObjectId = new mongoose.Types.ObjectId(chatId);

    const pipeline = [
      { $match: { chat: chatObjectId } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          messages: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
              },
            },
            {
              $unwind: {
                path: "$sender",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                __v: 0,
                "sender.password": 0,
                "sender.refreshToken": 0,
                "sender.__v": 0,
                "sender.mutedChats": 0,
                "sender.friends": 0,
                "sender.updatedAt": 0,
                "sender.createdAt": 0,
              },
            },
          ],
          totalCount: [
            {
              $count: "totalMessages",
            },
          ],
        },
      },
      {
        $addFields: {
          totalMessages: {
            $ifNull: [{ $arrayElemAt: ["$totalCount.totalMessages", 0] }, 0],
          },
        },
      },
      {
        $project: {
          messages: 1,
          totalMessages: 1,
          totalPages: {
            $ceil: { $divide: ["$totalMessages", limit] },
          },
        },
      },
    ];

    const result = await Message.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            messages: [],
            totalMessages: 0,
            totalPages: 0,
          },
          "No messages found."
        )
      );
    }

    const { messages, totalMessages, totalPages } = result[0];

    const data = {
      messages,
      totalMessages,
      totalPages,
      currentPage: page,
      limit,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Messages fetched successfully"));
  } catch (error) {
    return next(
      createError.internalServerError(
        500,
        "An error occurred while fetching messages."
      )
    );
  }
});

const deleteMessageForSelectedParticipants = asyncHandler(
  async (req, res, next) => {
    const { messageIds, isDeletedForAll } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return next(
        createError.badRequest("messageId must be a non-empty array")
      );
    }

    if (!messageIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return next(createError.badRequest("Invalid message id"));
    }

    // Fetch messages
    const messages = await Message.find({ _id: { $in: messageIds } });
    if (!messages.length) {
      return next(createError.notFound("Messages not found"));
    }

    if (isDeletedForAll) {
      for (const message of messages) {
        if (!userId.equals(message.sender)) {
          return next(
            createError.forbidden(
              "You are not allowed to delete this message for everyone"
            )
          );
        }
      }
    }

    // Update messages
    const deleteMessages = await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        $set: { isDeletedForAll },
        $addToSet: { deletedBy: req.user._id },
      }
    );

    if (!deleteMessages.modifiedCount) {
      return next(createError.internalServerError("Failed to delete message"));
    }

    // Emit delete event
    emitEventForMessageDeleteEitherForEveryoneOrSelf(
      req.app.get("io"),
      messages[0].chat,
      req.user._id,
      isDeletedForAll,
      messages.map((message) => message._id)
    );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Message deleted successfully"));
  }
);

const deleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.body;

  const message = await Message.findById(messageId);

  if (!message) {
    return next(createError.notFound("Message not found"));
  }

  const deleteMessage = await Message.findByIdAndDelete(messageId);

  if (!deleteMessage) {
    return next(createError.internalServerError("Failed to delete message"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message deleted successfully"));
});

const clearChatMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(createError.notFound("Chat not found"));
  }

  const deleteMessages = await Message.deleteMany({ chat: chatId });

  if (!deleteMessages) {
    return next(createError.internalServerError("Failed to delete messages"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Messages cleared successfully"));
});

export {
  createMessage,
  getMyMessages,
  getMessagesBasedOnChatId,
  deleteMessageForSelectedParticipants,
  deleteMessage,
  clearChatMessages,
};
