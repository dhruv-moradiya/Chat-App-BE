import mongoose from "mongoose";
import Message from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFilesToCloudinary } from "../utils/cloudinary.js";

const createMessage = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;

  const senderId = req.user._id;

  const attachments = req.files?.attachments;
  const attachmentsLocalPath = attachments?.map(
    (attachment) => attachment.path
  );
  const publicIds = attachments?.map((attachment) => attachment.originalname);

  const response = await uploadFilesToCloudinary(
    attachmentsLocalPath,
    req.user.username,
    publicIds
  );

  console.log("response :>> ", response);

  res.end("File uploaded successfully");

  const message = await Message.create({
    sender: senderId,
    chat: chatId,
    content,
  });

  if (!message) {
    throw createError.internalServerError("Failed to create message");
  }

  const messageResponse = {
    _id: message._id,
    sender: message.sender,
    chat: message.chat,
    content: message.content,
  };

  return res
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

const getMessagesBasedOnChatId = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const Message = await Message.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
      },
    },
  ]);
});

export { createMessage, getMyMessages };
