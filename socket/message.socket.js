import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

import { emitError } from "./index.js";
import { logger } from "../utils/logger.js";
import { ChatEventEnum } from "../constants/index.js";
import { stripBase64Prefix } from "../utils/helpers.js";
import { uploadFilesToCloudinary } from "../utils/cloudinary.js";

// Upload attachments to Cloudinary and update the message in the database and emit the updated message event to the chat room.
const uploadAttachmentOnCloudinary = (
  io,
  user,
  chatId,
  message,
  attachmentsBuffer,
  publicIds
) => {
  let attachmentsData = [];
  uploadFilesToCloudinary(attachmentsBuffer, user.username, publicIds)
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
        sender: user,
      };

      emitEventForUpdatedMessageWithAttachment(
        io,
        chatId,
        messageResponseForSocket
      );
    })
    .catch((err) => {
      console.error("Error uploading files to Cloudinary:", err);
      attachmentsData = [];

      throw createError.internalServerError(
        500,
        "Failed to upload files to Cloudinary"
      );
    });
};

// Emit an event to the chat room when a message with attachments is updated.
// This event is triggered after the attachments have been successfully uploaded to Cloudinary and the message in the database has been updated.
const emitEventForUpdatedMessageWithAttachment = (io, chatId, message) => {
  io.to(chatId).emit(ChatEventEnum.UPDATED_MESSAGE_WITH_ATTACHMENT_EVENT, {
    message,
  });
};

// Listening for the message send event from the client.
// This event is triggered when a user sends a message in the chat.
const listeningForMessageSendEvent = (io, socket) => {
  socket.on(ChatEventEnum.MESSAGE_SEND_EVENT, async ({ messageData }) => {
    const {
      chatId,
      content = "",
      replyTo,
      attachments = [],
      mentionedUsers,
    } = messageData;

    const senderId = socket.user._id;
    const tempId = new mongoose.Types.ObjectId();
    const createdAt = new Date().toISOString();

    const newMessageData = {
      _id: tempId,
      sender: senderId,
      chat: chatId,
      content,
      createdAt,
      ...(mentionedUsers && { mentionedUsers }),
      ...(replyTo && { replyTo }),
    };

    try {
      const message = await Message.create(newMessageData);

      emitEventForNewMessageReceived(io, chatId, {
        ...message.toObject(),
        sender: socket.user,
        ...(attachments.length > 0 && { isAttachment: true }),
      });

      if (attachments.length > 0) {
        const buffers = attachments.map((file) =>
          Buffer.from(stripBase64Prefix(file), "base64")
        );

        const publicIds = attachments.map(
          (_, index) => `/messageId/${tempId}/${index}/${socket.user.username}`
        );

        uploadAttachmentOnCloudinary(
          io,
          socket.user,
          chatId,
          message,
          buffers,
          publicIds
        );
      }
    } catch (error) {
      console.error("Message send error:", error);
      emitError(socket, "Error while sending the message.");
    }
  });
};

// It handles sending the message to all participants in the chat room when a new message is received.
// It checks if all participants are in the room and emits the message to them.
// If some participants are not in the room, it emits an unread message event to them and updates the unread message count in the database.
// It also handles sending notifications to users who are not in the room.
const emitEventForNewMessageReceived = async (io, chatId, message) => {
  try {
    const chatIdStr = chatId.toString();

    // * io.sockets.adapter.rooms.get(chatId.toString()) This will only provide sockets IDs ||  io.sockets.sockets.get(socketId) This will provide that socket's info that we have add at time when user join in the room via their user ID
    // Get all members currently in the room
    const roomMembers = io.sockets.adapter.rooms.get(chatIdStr) || new Set();

    // Extract user IDs from sockets in the room
    const userIdsInRoom = new Set(
      Array.from(roomMembers).map((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        return socket?.user?._id.toString();
      })
    );

    // Fetch all participants of the chat
    const chat = await Chat.findById(chatId, { participants: 1 }).lean();
    const chatParticipants = new Set(
      chat?.participants.map((p) => p._id.toString()) || []
    );

    // Check if all participants are in the room
    const isAllParticipantsInRoom = [...chatParticipants].every((id) =>
      userIdsInRoom.has(id)
    );

    if (isAllParticipantsInRoom) {
      logger.debug(
        `All participants are in the room. Emitting message received event.`
      );
      io.to(chatIdStr).emit(ChatEventEnum.MESSAGE_RECEIVED_EVENT, { message });
      return;
    }

    // Get all currently connected sockets and their user IDs
    const allConnectedSockets = Array.from(io.sockets.sockets.keys());
    const onlineUserIds = new Set(
      allConnectedSockets.map((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        return socket?.user?._id.toString(); // Extract user IDs of online users
      })
    );

    // Identify participants not currently in the room
    const userThatAreNotInTheRoom = [...chatParticipants].filter(
      (id) => !userIdsInRoom.has(id)
    );

    // Identify participants who are in the room
    const userThatAreInTheRoom = [...chatParticipants].filter((id) =>
      userIdsInRoom.has(id)
    );

    // Emit message received event to users already in the room
    userThatAreInTheRoom.forEach((userId) => {
      io.to(userId).emit(ChatEventEnum.MESSAGE_RECEIVED_EVENT, { message });
    });

    // Prepare bulk update operations for unread message count
    const bulkUpdates = [];

    for (const userId of userThatAreNotInTheRoom) {
      if (onlineUserIds.has(userId)) {
        if (userId) {
          logger.debug(
            `Emitting unread message event for online user: ${userId}`
          );
          io.to(userId).emit(ChatEventEnum.UNREAD_MESSAGE_EVENT, {
            chatId,
            message,
          });

          sendNotification("new_message", userId, message._id, "Message", io, {
            isAttachment: message?.isAttachment,
          });
        }
      }

      // Push bulk update for unread message count
      bulkUpdates.push({
        updateOne: {
          filter: { _id: chatId },
          update: { $inc: { [`unreadMessagesCounts.${userId}`]: 1 } },
        },
      });
    }

    // Execute bulk update if there are any unread messages to update
    if (bulkUpdates.length > 0) {
      await Chat.bulkWrite(bulkUpdates);
      logger.debug(
        `Updated unread message count for ${bulkUpdates.length} users.`
      );
    }
  } catch (error) {
    logger.error(`Error in emitting new message event: ${error.message}`);
  }
};

// Emit an event for message deletion, either for everyone or just for the sender.
// This event is triggered when a message is deleted in the chat room, and it notifies either all participants or just the sender, depending on the deletion type.
const emitEventForMessageDeleteEitherForEveryoneOrSelf = (
  io,
  chatId,
  userId,
  isDeletedForAll,
  messageIds
) => {
  if (isDeletedForAll) {
    io.to(chatId.toString()).emit(
      ChatEventEnum.DELETE_MESSAGE_FOR_EVERYONE_OR_SELF_EVENT,
      {
        chatId,
        messageIds,
        deletedBy: userId,
        isDeletedForAll,
      }
    );
  } else {
    io.to(userId).emit(
      ChatEventEnum.DELETE_MESSAGE_FOR_EVERYONE_OR_SELF_EVENT,
      {
        chatId,
        messageIds,
        deletedBy: userId,
        isDeletedForAll,
      }
    );
  }
};

export {
  listeningForMessageSendEvent,
  emitEventForNewMessageReceived,
  emitEventForMessageDeleteEitherForEveryoneOrSelf,
  emitEventForUpdatedMessageWithAttachment,
};
