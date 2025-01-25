import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { ChatEventEnum } from "../constants/index.js";
import { logger } from "../utils/logger.js";
import Chat from "../models/chat.model.js";
import mongoose from "mongoose";
import { areArraysEqual } from "../utils/helpers.js";

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
        await Chat.updateOne(
          { _id: chatId },
          { $inc: { [`unreadMessagesCounts.${userId}`]: 1 } }
        );
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

// Function to emit the event for unread message count when user first time join to the socket
const emitUnreadMessageCount = async (io, userId) => {
  const unreadMessagesQuery = await Chat.aggregate([
    {
      $match: {
        participants: {
          $elemMatch: {
            $eq: new mongoose.Types.ObjectId(userId),
          },
        },
      },
    },
    {
      $project: {
        unreadMessagesCounts: {
          $ifNull: ["$unreadMessagesCounts." + userId, 0],
        },
        _id: 1,
      },
    },
  ]);

  console.log("unreadMessagesQuery :>> ", unreadMessagesQuery);

  io.to(userId).emit(
    ChatEventEnum.UNREAD_MESSAGE_COUNT_EVENT,
    unreadMessagesQuery
  );
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
};
