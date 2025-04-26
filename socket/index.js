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

      console.log("message :>> ", message);

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

const NotificationTypeEnum = {
  MENTION: "MENTION",
  REACTED: "REACTED",
  REPLIED: "REPLIED",
  ATTACHMENT: "ATTACHMENT",
  APP_NOTIFICATION: "APP_NOTIFICATION",
  NEW_MESSAGE: "NEW_MESSAGE",
};

const manageNotifications = async (io, socketId, message) => {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return; // socket not found

  const userId = socket.user?._id.toString();
  const chatId = message.chat._id.toString();
  const tempId = new mongoose.Types.ObjectId();

  const isMentioned = message.mentionedUsers?.some(
    (mentionedUser) => mentionedUser._id.toString() === userId
  );

  const isReacted = message.reactions?.some(
    (reaction) => reaction.user.toString() === userId
  );

  const isReply = !!message.replyTo;
  const hasAttachment = (message.attachments || []).length > 0;

  let notificationType = null;
  let notificationContent = "";

  if (isMentioned && hasAttachment) {
    notificationType = NotificationTypeEnum.MENTION;
    notificationContent = `${message.sender.username} mentioned you with an attachment.`;
  } else if (isMentioned) {
    notificationType = NotificationTypeEnum.MENTION;
    notificationContent = `${message.sender.username} mentioned you in a message.`;
  } else if (isReacted) {
    notificationType = NotificationTypeEnum.REACTED;
    notificationContent = `${message.sender.username} reacted to your message.`;
  } else if (isReply) {
    notificationType = NotificationTypeEnum.REPLIED;
    notificationContent = `${message.sender.username} replied to your message.`;
  } else if (hasAttachment) {
    notificationType = NotificationTypeEnum.ATTACHMENT;
    notificationContent = `${message.sender.username} sent an attachment.`;
  } else {
    notificationType = NotificationTypeEnum.NEW_MESSAGE;
    notificationContent = `${message.sender.username} sent a new message.`;
  }

  if (!notificationType) return;

  const notificationData = {
    _id: tempId,
    sender: message.sender._id,
    receivers: [userId],
    notificationType,
    message: message.content,
    isRead: false,
  };

  io.to(userId).emit(ChatEventEnum.NOTIFICATION_EVENT, {
    ...notificationData,
    content: notificationContent,
    chatId,
    messageId: message._id,
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
  // Get all members currently in the room
  const roomMembers =
    io.sockets.adapter.rooms.get(chatId.toString()) || new Set();
  const userIdsInRoom = Array.from(roomMembers).map((socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    return socket?.user?._id.toString(); // Extract user ID from socket
  });

  // Fetch all participants of the chat from the database
  const chat = await Chat.findById(chatId, { participants: 1 }).lean();
  const chatParticipants =
    chat?.participants.map((p) => p._id.toString()) || []; // Extract participant IDs

  // Check if all participants are in the room
  const isAllParticipantsInRoom = chatParticipants.every((id) =>
    userIdsInRoom.includes(id)
  );

  if (isAllParticipantsInRoom) {
    logger.debug(
      `All participants are in the room. Emitting message received event.`
    );
    // Emit message received event to all users in the room if everyone is present
    io.to(chatId.toString()).emit(ChatEventEnum.MESSAGE_RECEIVED_EVENT, {
      message,
    });
    return;
  }

  // Get all currently connected sockets and their user IDs
  const allConnectedSockets = Array.from(io.sockets.sockets.keys());
  const onlineUserIds = allConnectedSockets.map((socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    return socket?.user?._id.toString(); // Extract user IDs of online users
  });
  // Prepare bulk update operations for unread message count
  const bulkUpdates = [];

  // Identify participants not currently in the room
  const userThatAreNotInTheRoom = chatParticipants.filter(
    (id) => !userIdsInRoom.includes(id)
  );

  // Identify participants who are in the room
  const userThatAreInTheRoom = chatParticipants.filter((id) =>
    userIdsInRoom.includes(id)
  );

  // Emit message received event to users already in the room
  userThatAreInTheRoom.forEach((userId) => {
    io.to(userId).emit(ChatEventEnum.MESSAGE_RECEIVED_EVENT, {
      message,
    });
  });

  // Handle users not in the room
  userThatAreNotInTheRoom.forEach(async (userId) => {
    if (onlineUserIds.includes(userId)) {
      // If the user is online but not in the room, emit an unread message event
      const userSocketId = allConnectedSockets.find((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        return socket?.user?._id.toString() === userId;
      });
      if (userSocketId) {
        logger.debug(`Emitting unread message event for user: ${userId}`);
        io.to(userSocketId).emit(ChatEventEnum.UNREAD_MESSAGE_EVENT, {
          chatId,
          message,
        });
        // Update the database with the unread message count in the case if user is online and didn't join to the room
        bulkUpdates.push({
          updateOne: {
            filter: { _id: chatId },
            update: { $inc: { [`unreadMessagesCounts.${userId}`]: 1 } },
          },
        });
        // Execute bulk update operation
        if (bulkUpdates.length > 0) {
          await Chat.bulkWrite(bulkUpdates);
          bulkUpdates.length = 0; // Clear the array after executing the bulk operation
        }
      }
    } else {
      // If the user is offline, update the database with the unread message count
      logger.debug(`Updating unread message count in DB for user: ${userId}`);
      await Chat.updateOne(
        { _id: chatId },
        { $inc: { [`unreadMessagesCounts.${userId}`]: 1 } }
      );
    }
  });
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
