import mongoose from "mongoose";
import Message from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFilesToCloudinary } from "../utils/cloudinary.js";
import { createError } from "../utils/ApiError.js";

const createMessage = asyncHandler(async (req, res) => {
  const { chatId, content, replyTo } = req.body;
  const senderId = req.user._id;

  const attachments = req.files?.attachments;

  let attachmentsData = [];

  if (attachments?.length) {
    const attachmentsLocalPath = attachments.map((file) => file.path);
    const publicIds = attachments.map((file) => file.originalname);

    const uploadedFiles = await uploadFilesToCloudinary(
      attachmentsLocalPath,
      req.user.username,
      publicIds
    );

    attachmentsData = uploadedFiles?.map((file) => ({
      url: file.secure_url,
      fileName: file.original_filename,
      publicId: file.public_id,
    }));
  }

  const newMessageData = {
    sender: senderId,
    chat: chatId,
    content,
    ...(attachmentsData.length && { attachments: attachmentsData }),
    ...(replyTo && { replyTo }),
  };

  const message = await Message.create(newMessageData);

  if (!message) {
    throw createError.internalServerError("Failed to create message");
  }

  const messageResponse = {
    _id: message._id,
  };

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
    let { page = 1, limit = 10 } = req.query;

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
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                __v: 0,
              },
            },
          ],
          totalCount: [{ $count: "totalMessages" }],
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
    // Handle potential errors, such as invalid ObjectId
    return next(
      createError.internalServerError(
        500,
        "An error occurred while fetching messages."
      )
    );
  }
});

export { createMessage, getMyMessages, getMessagesBasedOnChatId };
