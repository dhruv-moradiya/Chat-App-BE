import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { ChatEventEnum } from "../constants/index.js";
import { logger } from "../utils/logger.js";
import Chat from "../models/chat.model.js";
import mongoose from "mongoose";
import { areArraysEqual } from "../utils/helpers.js";
import Message from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ManageNotifications } from "./notificationService.js";

const emitError = (socket, error) => {
  socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, error);
};

const mountParticipantTypingEvent = (socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    console.log(`User is typing. chatId: `, chatId);
    socket.to(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};

const mountParticipantStopTypingEvent = (socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    console.log(`User stopped typing. chatId: `, chatId);
    socket.to(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

const listenForLeaveChatEvent = (io, socket) => {
  socket.on(ChatEventEnum.LEAVE_CHAT_EVENT, (chatId) => {
    console.log(`User left the chat. chatId: `, chatId);
    socket.leave(chatId);
  });
};

const listenForCurrentActiveChat = (io, socket) => {
  socket.on(
    ChatEventEnum.CURRENT_ACTIVE_CHAT_EVENT,
    async ({ chatId, userData }) => {
      // TODO: Add validation for chatId and userData
      if (!chatId || !userData?._id || !userData?.username) {
        logger.error("Chat ID and user data are required.");
        return;
      }

      const userId = userData._id;
      const userName = userData.username;

      io.to(userId).socketsJoin(chatId);
      logger.info(`${userName} joined to chat room: ${chatId}`);

      io.to(chatId).emit(ChatEventEnum.ROOM_CREATED_EVENT, {
        chatId,
        userName,
      });

      await Chat.updateOne(
        { _id: chatId },
        { $set: { [`unreadMessagesCounts.${userId}`]: 0 } }
      );
    }
  );
};

const emitEventForUpdatedMessageWithAttachment = (io, chatId, message) => {
  io.to(chatId).emit(ChatEventEnum.UPDATED_MESSAGE_WITH_ATTACHMENT_EVENT, {
    message,
  });
};

const listeningForMessageSendEvent = (io, socket) => {
  socket.on(ChatEventEnum.MESSAGE_SEND_EVENT, async ({ messageData }) => {
    const { chatId, content, replyTo, isAttachment, mentionedUsers } =
      messageData;
    const senderId = socket.user._id;

    const tempId = new mongoose.Types.ObjectId();
    const createdAt = new Date().toISOString();

    const message = {
      _id: tempId,
      sender: socket.user,
      chat: chatId,
      content: content || "",
      createdAt,
      updatedAt: createdAt,
      isPending: true,
      attachments: [],
      deletedBy: [],
      reactions: [],
      ...(mentionedUsers && { mentionedUsers }),
      ...(isAttachment && { isAttachment }),
      ...(replyTo && { replyTo }),
    };

    // Emit message received event to all users in the room
    // emitEventForNewMessageReceived(io, chatId, message);

    try {
      const newMessageData = {
        _id: tempId,
        sender: senderId,
        chat: chatId,
        content: content || "",
        createdAt,
        ...(mentionedUsers && { mentionedUsers }),
        ...(replyTo && { replyTo }),
      };

      const message = await Message.create(newMessageData);

      emitEventForNewMessageReceived(io, chatId, {
        ...message.toObject(),
        sender: socket.user,
        ...(isAttachment && { isAttachment }),
        // isPending: false,
      });
    } catch (error) {
      emitError(socket, "Error while sending the message.");
    }
  });
};

const listeningForMessageReactionEvent = (io, socket) => {
  socket.on(
    ChatEventEnum.MESSAGE_REACT_EVENT,
    async ({ chatId, messageId, emoji, userId }) => {
      socket.broadcast.to(chatId).emit(ChatEventEnum.MESSAGE_REACT_EVENT, {
        chatId,
        messageId,
        emoji,
        userId,
      });
      try {
        const updatedMessage = await Message.findOneAndUpdate(
          { _id: messageId },
          { $push: { reactions: { userId, emoji } } },
          { new: true, upsert: false }
        );

        if (!updatedMessage) {
          return socket.emit(ChatEventEnum.ERROR_EVENT, {
            message: "Message not found.",
          });
        }

        socket.broadcast.to(chatId).emit(ChatEventEnum.MESSAGE_REACT_EVENT, {
          chatId,
          messageId,
          emoji,
          userId,
        });

        logger.info(
          `✅ Reaction added to message ${messageId} by user ${userId}`
        );
      } catch (error) {
        logger.error(`❌ Error updating message reaction: ${error.message}`);
        // socket.emit(ChatEventEnum.ERROR_EVENT, { message: "Failed to react to message." });
      }
    }
  );
};

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
        // Find the user's socket ID

        // TODO: No need for this loop and handle offline user to save notification in the DB
        const userSocketId = allConnectedSockets.find((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          return socket?.user?._id.toString() === userId;
        });

        if (userSocketId) {
          logger.debug(
            `Emitting unread message event for online user: ${userId}`
          );
          io.to(userSocketId).emit(ChatEventEnum.UNREAD_MESSAGE_EVENT, {
            chatId,
            message,
          });

          // Notification handling
          const socket = io.sockets.sockets.get(userSocketId);
          if (!socket) return; // socket not found

          const userIdForNotification = socket.user?._id.toString();
          const manageNotification = new ManageNotifications(
            io,
            userSocketId,
            message
          );
          await manageNotification.sendNotification(userIdForNotification);
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

const initializeSocket = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");

      let token = cookies.token;
      if (!token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findOne({ _id: decoded._id }).select(
        "-password -refreshToken -__v"
      );

      if (!user) {
        throw new ApiError(401, "Un-authorized handshake. User is missing");
      }

      socket.join(user._id.toString());
      socket.user = user;

      socket.emit(
        ChatEventEnum.CONNECTED_EVENT,
        `${user.username} is connected successfully.`
      );
      logger.info(`✨ ${user.username} is connected successfully.`);

      socket.emit("TEST_EVENT", {
        message: "Emit Test Event.",
      });

      mountParticipantTypingEvent(socket);
      mountParticipantStopTypingEvent(socket);
      listenForLeaveChatEvent(io, socket);
      listenForCurrentActiveChat(io, socket);
      listeningForMessageSendEvent(io, socket);
      listeningForMessageReactionEvent(io, socket);
      // emitUnreadMessageCount(io, user._id.toString());

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        logger.info(
          `🚫 User disconnected ID: ${user._id.toString()} Username: ${
            user.username
          }`
        );
        if (socket.user?._id) {
          socket.leave(socket.user._id.toString());
          socket.removeAllListeners();
        }
      });
    } catch (error) {
      logger.error(error);
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error?.message || "Something went wrong while connecting the socket"
      );
    }
  });
};

export {
  initializeSocket,
  emitEventForNewMessageReceived,
  emitEventForUpdatedMessageWithAttachment,
  emitEventForMessageDeleteEitherForEveryoneOrSelf,
};
